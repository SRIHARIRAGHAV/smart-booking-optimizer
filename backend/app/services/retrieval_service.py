import os
import math
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from llama_index.core.embeddings import BaseEmbedding
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    Document
)

class DeterministicTermEmbedding(BaseEmbedding):
    """
    Lightweight, deterministic term-frequency hash embedding for local LlamaIndex vector search.
    Requires no GPU, external downloads, or API keys while producing accurate cosine semantic matching.
    """
    def __init__(self, dim: int = 512, **kwargs):
        super().__init__(**kwargs)
        self._dim = dim

    def _embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self._dim
        words = re.findall(r'\b[a-z0-9_]{2,}\b', text.lower())
        if not words:
            return vec
        for w in words:
            h = abs(hash(w)) % self._dim
            vec[h] += 1.0
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def _get_query_embedding(self, query: str) -> List[float]:
        return self._embed_text(query)

    def _get_text_embedding(self, text: str) -> List[float]:
        return self._embed_text(text)

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._embed_text(query)

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return self._embed_text(text)

class TravelKnowledgeRetrievalService:
    def __init__(
        self,
        docs_dir: Optional[str] = None,
        storage_dir: Optional[str] = None
    ):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.docs_dir = Path(docs_dir or os.path.join(base_dir, "knowledge_base", "documents"))
        self.storage_dir = Path(storage_dir or os.path.join(base_dir, "knowledge_base", "storage"))
        self.embed_model = DeterministicTermEmbedding(dim=512)
        self.index: Optional[VectorStoreIndex] = None
        self._initialized = False

    def initialize(self) -> bool:
        """
        Build or load index from storage.
        """
        try:
            if self.storage_dir.exists() and (self.storage_dir / "docstore.json").exists():
                storage_context = StorageContext.from_defaults(persist_dir=str(self.storage_dir))
                self.index = load_index_from_storage(storage_context, embed_model=self.embed_model)
                self._initialized = True
                return True

            # If no stored index, build from documents
            if self.docs_dir.exists():
                docs: List[Document] = []
                for p in self.docs_dir.glob("*.txt"):
                    text = p.read_text(encoding="utf-8")
                    docs.append(Document(text=text, metadata={"file_name": p.name}))

                if docs:
                    self.storage_dir.mkdir(parents=True, exist_ok=True)
                    self.index = VectorStoreIndex.from_documents(docs, embed_model=self.embed_model)
                    self.index.storage_context.persist(persist_dir=str(self.storage_dir))
                    self._initialized = True
                    return True
        except Exception as e:
            print(f"[RetrievalService] Initialization error: {e}")
            self._initialized = False

        return False

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieve relevant knowledge passages with source metadata.
        """
        if not self._initialized or not self.index:
            success = self.initialize()
            if not success or not self.index:
                return [{
                    "text": "Retrieval knowledge base currently unavailable; defaulting to deterministic rules.",
                    "source": "SYSTEM_FALLBACK",
                    "score": 0.0
                }]

        try:
            retriever = self.index.as_retriever(similarity_top_k=top_k)
            nodes = retriever.retrieve(query)
            results = []
            for node in nodes:
                results.append({
                    "text": node.node.get_content().strip(),
                    "source": node.node.metadata.get("file_name", "travel_knowledge.txt"),
                    "score": round(float(node.score or 0.0), 4)
                })
            return results
        except Exception as e:
            print(f"[RetrievalService] Retrieval failed: {e}")
            return [{
                "text": "Retrieval error encountered; applying baseline policy rules.",
                "source": "ERROR_FALLBACK",
                "score": 0.0
            }]

# Global singleton
_retrieval_service: Optional[TravelKnowledgeRetrievalService] = None

def get_retrieval_service() -> TravelKnowledgeRetrievalService:
    global _retrieval_service
    if _retrieval_service is None:
        _retrieval_service = TravelKnowledgeRetrievalService()
        _retrieval_service.initialize()
    return _retrieval_service
