/**
 * Algorytm znajdowania wspólnych terminów dla grupy użytkowników
 * Analizuje zajęte sloty czasowe i znajduje wspólne wolne przedziały
 */

/**
 * Znajduje wspólne wolne terminy dla grupy użytkowników
 * @param {Array} usersAvailability - Tablica z dostępnością użytkowników
 * @param {Date} startDate - Data początkowa zakresu
 * @param {Date} endDate - Data końcowa zakresu
 * @param {Number} durationMinutes - Minimalna długość spotkania w minutach
 * @param {Object} preferences - Opcjonalne preferencje (preferowane godziny, dni)
 * @returns {Array} - Tablica wspólnych wolnych slotów czasowych
 */
function findCommonAvailableSlots(usersAvailability, startDate, endDate, durationMinutes, preferences = {}) {
  const {
    preferredDays = [], // 0-6 (niedziela-sobota)
    preferredStartHour = 8,
    preferredEndHour = 22,
    slotInterval = 30 // Interwał slotów w minutach
  } = preferences;

  // Stwórz mapę zajętych slotów dla każdego użytkownika
  const usersBusySlots = usersAvailability.reduce((acc, availability) => {
    const userId = availability.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    
    if (availability.status === 'busy') {
      acc[userId].push({
        start: new Date(availability.start_time),
        end: new Date(availability.end_time)
      });
    }
    
    return acc;
  }, {});

  const userIds = Object.keys(usersBusySlots);
  const commonFreeSlots = [];

  // Generuj potencjalne sloty czasowe
  const currentSlot = new Date(startDate);
  currentSlot.setHours(preferredStartHour, 0, 0, 0);

  while (currentSlot < endDate) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);
    
    // Sprawdź czy slot mieści się w preferowanych godzinach
    const slotHour = currentSlot.getHours();
    const slotDay = currentSlot.getDay();
    
    const isInPreferredHours = slotHour >= preferredStartHour && slotEnd.getHours() <= preferredEndHour;
    const isInPreferredDays = preferredDays.length === 0 || preferredDays.includes(slotDay);
    
    if (isInPreferredHours && isInPreferredDays) {
      // Sprawdź czy slot jest wolny dla wszystkich użytkowników
      const isAvailableForAll = userIds.every(userId => {
        return !isSlotConflicting(currentSlot, slotEnd, usersBusySlots[userId]);
      });

      if (isAvailableForAll) {
        commonFreeSlots.push({
          start: new Date(currentSlot),
          end: new Date(slotEnd),
          availableUsers: userIds.length
        });
      }
    }

    // Przejdź do następnego slotu
    currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval);
    
    // Jeśli przekroczyliśmy preferowaną godzinę końca, przeskocz do następnego dnia
    if (currentSlot.getHours() >= preferredEndHour) {
      currentSlot.setDate(currentSlot.getDate() + 1);
      currentSlot.setHours(preferredStartHour, 0, 0, 0);
    }
  }

  return commonFreeSlots;
}

/**
 * Sprawdza czy proponowany slot koliduje z zajętymi slotami
 * @param {Date} slotStart - Początek slotu
 * @param {Date} slotEnd - Koniec slotu
 * @param {Array} busySlots - Tablica zajętych slotów
 * @returns {Boolean} - true jeśli jest konflikt
 */
function isSlotConflicting(slotStart, slotEnd, busySlots) {
  return busySlots.some(busy => {
    // Sprawdź czy sloty się nakładają
    return (slotStart < busy.end && slotEnd > busy.start);
  });
}

/**
 * Łączy sąsiadujące sloty czasowe w dłuższe przedziały
 * @param {Array} slots - Tablica slotów
 * @param {Number} maxGapMinutes - Maksymalny odstęp między slotami do połączenia
 * @param {Number} maxDurationMinutes - Maksymalna długość połączonego slotu (opcjonalnie)
 * @returns {Array} - Tablica połączonych slotów
 */
function mergeAdjacentSlots(slots, maxGapMinutes = 0, maxDurationMinutes = null) {
  if (slots.length === 0) return [];

  const merged = [];
  let current = { ...slots[0] };

  for (let i = 1; i < slots.length; i++) {
    const slot = slots[i];
    const gapMinutes = (slot.start - current.end) / 60000;
    const currentDurationMinutes = (current.end - current.start) / 60000;

    // Sprawdź czy możemy połączyć sloty
    const canMerge = gapMinutes <= maxGapMinutes;
    
    // Jeśli podano maksymalną długość, sprawdź czy nie przekroczymy limitu
    const wouldExceedMax = maxDurationMinutes && 
      (currentDurationMinutes + gapMinutes + (slot.end - slot.start) / 60000) > maxDurationMinutes;

    if (canMerge && !wouldExceedMax) {
      // Połącz sloty
      current.end = slot.end;
    } else {
      // Zapisz obecny slot i zacznij nowy
      merged.push(current);
      current = { ...slot };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Ocenia jakość slotu na podstawie preferencji
 * @param {Object} slot - Slot czasowy
 * @param {Object} preferences - Preferencje
 * @returns {Number} - Wynik (wyższy = lepszy)
 */
function scoreSlot(slot, preferences = {}) {
  const { preferredDays = [], preferredStartHour = 10, preferredEndHour = 18 } = preferences;
  
  let score = 100;
  
  const slotDay = slot.start.getDay();
  const slotHour = slot.start.getHours();
  
  // Premiuj preferowane dni
  if (preferredDays.length > 0 && preferredDays.includes(slotDay)) {
    score += 20;
  }
  
  // Premiuj godziny bliższe preferowanym
  const midPreferredHour = (preferredStartHour + preferredEndHour) / 2;
  const hourDifference = Math.abs(slotHour - midPreferredHour);
  score -= hourDifference * 2;
  
  // NIE premiuj dłuższych slotów - wszystkie sloty powinny mieć podobną długość
  // (zgodnie z durationMinutes). Zamiast tego premiuj sloty o dokładnie wymaganej długości
  const slotDurationMinutes = (slot.end - slot.start) / 60000;
  // Slot powinien mieć dokładnie wymaganą długość, więc nie dodajemy punktów za długość
  // (lub możemy dodać małą premię za sloty o dokładnie wymaganej długości)
  
  return score;
}

/**
 * Główna funkcja znajdująca i rankingująca wspólne terminy
 * @param {Array} usersAvailability - Dostępność użytkowników
 * @param {Object} searchParams - Parametry wyszukiwania
 * @returns {Array} - Posortowana lista najlepszych terminów
 */
function findBestCommonSlots(usersAvailability, searchParams) {
  const {
    startDate,
    endDate,
    durationMinutes,
    preferences = {},
    maxResults = 10
  } = searchParams;

  // Znajdź wspólne wolne sloty
  let freeSlots = findCommonAvailableSlots(
    usersAvailability,
    new Date(startDate),
    new Date(endDate),
    durationMinutes,
    preferences
  );

  // NIE łącz slotów - każdy slot powinien mieć dokładnie wymaganą długość
  // Jeśli chcesz połączyć sloty, użyj maxDurationMinutes = durationMinutes * 2
  // aby nie tworzyć zbyt długich slotów
  // freeSlots = mergeAdjacentSlots(freeSlots, 0, durationMinutes * 2);

  // Zamiast łączenia, wybierz najlepsze pojedyncze sloty
  // Każdy slot ma już dokładnie wymaganą długość (durationMinutes)

  // Oceń i posortuj sloty
  const scoredSlots = freeSlots.map(slot => ({
    ...slot,
    score: scoreSlot(slot, preferences)
  }));

  scoredSlots.sort((a, b) => b.score - a.score);

  return scoredSlots.slice(0, maxResults);
}

module.exports = {
  findCommonAvailableSlots,
  findBestCommonSlots,
  mergeAdjacentSlots,
  scoreSlot
};

