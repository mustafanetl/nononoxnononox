
export const getBookingDotComUrl = (hotelName: string, location: string) => {
  const query = encodeURIComponent(`${hotelName} ${location}`);
  return `https://www.booking.com/searchresults.html?ss=${query}`;
};

export const getSkyscannerUrl = (from: string, to: string, date: string) => {
  return `https://www.skyscanner.com/transport/flights/${from}/${to}/${date}/`;
};
