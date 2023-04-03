export const getEmoji = (size: number): string => {
  switch (size) {
    case 3:
    case 4:
    case 5:
      return "Сегодня холодно 🥶";
    case 6:
    case 7:
    case 8:
      return "Линейка китайская прост 😔";
    case 9:
    case 10:
    case 11:
      return "Средний размер, сам мерял! 🙄";
    case 12:
    case 13:
      return "😊";
    case 14:
    case 15:
      return "😇";
    case 16:
    case 17:
    case 18:
      return "😎";
    case 19:
    case 20:
    case 21:
    case 22:
    case 23:
    case 24:
      return "😲";
    case 25:
    case 26:
    case 27:
    case 28:
    case 29:
    case 30:
      return "☣😨☣";
    default:
      return "bruh";
  }
};
