import urllib.parse
from typing import Dict, Any, Optional

def generate_airline_booking_links(
    airline: str,
    flight_id: str,
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str] = None,
    passengers: int = 1
) -> Dict[str, str]:
    """
    Generate official direct links for airlines so users can book directly
    on the carrier's site without agent fees ("agent-free").
    """
    airline_lower = airline.lower()
    encoded_origin = urllib.parse.quote(origin)
    encoded_dest = urllib.parse.quote(destination)

    # Google Flights universal deep-link with pre-filled query
    if return_date:
        gf_query = f"Flights from {origin} to {destination} on {departure_date} return {return_date}"
    else:
        gf_query = f"Flights from {origin} to {destination} on {departure_date}"
    google_flights_url = f"https://www.google.com/travel/flights?q={urllib.parse.quote(gf_query)}"

    # Carrier-specific official portals
    if "indigo" in airline_lower or "6e" in flight_id.lower():
        provider_name = "IndiGo Airlines (Official)"
        direct_url = "https://www.goindigo.in"
        search_url = f"https://www.goindigo.in/flight-booking.html?origin={encoded_origin}&destination={encoded_dest}&departureDate={departure_date}&pax={passengers}"
        manage_booking_url = "https://www.goindigo.in/manage-booking.html"
    elif "air india" in airline_lower or "ai-" in flight_id.lower():
        provider_name = "Air India (Official)"
        direct_url = "https://www.airindia.com"
        search_url = f"https://www.airindia.com/in/en/book/flight-search.html?origin={encoded_origin}&dest={encoded_dest}&date={departure_date}"
        manage_booking_url = "https://www.airindia.com/in/en/manage/manage-booking.html"
    elif "akasa" in airline_lower or "qp-" in flight_id.lower():
        provider_name = "Akasa Air (Official)"
        direct_url = "https://www.akasaair.com"
        search_url = f"https://www.akasaair.com/book?origin={encoded_origin}&destination={encoded_dest}&date={departure_date}"
        manage_booking_url = "https://www.akasaair.com/manage-booking"
    elif "spicejet" in airline_lower or "sg-" in flight_id.lower():
        provider_name = "SpiceJet (Official)"
        direct_url = "https://www.spicejet.com"
        search_url = f"https://www.spicejet.com/?origin={encoded_origin}&dest={encoded_dest}&date={departure_date}"
        manage_booking_url = "https://www.spicejet.com/managebooking"
    elif "vistara" in airline_lower or "uk-" in flight_id.lower():
        provider_name = "Vistara / Air India (Official)"
        direct_url = "https://www.airindia.com"
        search_url = f"https://www.airindia.com/in/en/book/flight-search.html?origin={encoded_origin}&dest={encoded_dest}"
        manage_booking_url = "https://www.airindia.com/in/en/manage/manage-booking.html"
    else:
        provider_name = f"{airline} (Official Carrier)"
        direct_url = google_flights_url
        search_url = google_flights_url
        manage_booking_url = google_flights_url

    return {
        "flight_provider_name": provider_name,
        "flight_direct_url": direct_url,
        "flight_search_url": search_url,
        "flight_google_url": google_flights_url,
        "flight_manage_booking_url": manage_booking_url
    }

def generate_hotel_booking_links(
    hotel_name: str,
    city: str,
    check_in_date: str,
    check_out_date: str,
    rooms: int = 1,
    passengers: int = 1
) -> Dict[str, str]:
    """
    Generate direct links for booking the hotel on official platforms
    (Booking.com, Agoda, MakeMyTrip, Google Hotels) without agent commissions.
    """
    search_query = f"{hotel_name} {city}"
    encoded_query = urllib.parse.quote(search_query)
    encoded_city = urllib.parse.quote(city)

    # Booking.com direct search URL
    booking_url = (
        f"https://www.booking.com/searchresults.html?ss={encoded_query}&"
        f"checkin={check_in_date}&checkout={check_out_date}&group_adults={passengers}&no_rooms={rooms}"
    )

    # Agoda direct search URL
    agoda_url = (
        f"https://www.agoda.com/search?city={encoded_city}&"
        f"checkIn={check_in_date}&checkOut={check_out_date}&rooms={rooms}&adults={passengers}"
    )

    # MakeMyTrip hotel search URL
    mmt_url = (
        f"https://www.makemytrip.com/hotels/hotel-listing/?"
        f"city={encoded_city}&checkin={check_in_date}&checkout={check_out_date}&roomStayQualifier={rooms}e{passengers}u"
    )

    # Google Hotels direct search URL
    google_hotels_url = f"https://www.google.com/travel/hotels/{encoded_city}?q={encoded_query}"

    return {
        "hotel_provider_name": f"{hotel_name} on Booking.com / Official Portal",
        "hotel_direct_url": booking_url,
        "hotel_search_url": booking_url,
        "hotel_agoda_url": agoda_url,
        "hotel_mmt_url": mmt_url,
        "hotel_google_url": google_hotels_url
    }

def build_site_booking_links(
    flight: Any,
    hotel: Any,
    reqs: Optional[Any] = None
) -> Dict[str, str]:
    """
    Combined site booking links for both chosen flight and hotel.
    """
    dep_date = getattr(reqs, "departure_date", "2026-11-10") if reqs else "2026-11-10"
    ret_date = getattr(reqs, "return_date", "2026-11-12") if reqs else "2026-11-12"
    pax = getattr(reqs, "passengers", 1) if reqs else 1
    rooms = getattr(reqs, "hotel_rooms", 1) if reqs else 1

    flight_info = generate_airline_booking_links(
        airline=getattr(flight, "airline", "Airline"),
        flight_id=getattr(flight, "flight_id", "FL-001"),
        origin=getattr(flight, "origin", "Chennai"),
        destination=getattr(flight, "destination", "Bengaluru"),
        departure_date=dep_date,
        return_date=ret_date,
        passengers=pax
    )

    hotel_info = generate_hotel_booking_links(
        hotel_name=getattr(hotel, "name", "Hotel"),
        city=getattr(hotel, "city", "Bengaluru"),
        check_in_date=dep_date,
        check_out_date=ret_date,
        rooms=rooms,
        passengers=pax
    )

    return {
        **flight_info,
        **hotel_info,
        "agent_free_notice": "Agent-Free Booking: You can book directly with the airline and hotel on their official websites with zero platform or intermediary commissions."
    }

