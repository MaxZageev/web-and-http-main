// Модуль для работы с API Star Wars. 
// Все методы обращаются к стороннему сервису, запрашивают данные у него.
// Методы асинхронны, они возвращают Promise.

// Есть следующие методы:
// starWars.searchCharacters(query), 
// starWars.searchPlanets(query), 
// starWars.searchSpecies(query).
// starWars.getCharactersById(id), 
// starWars.getPlanetsById(id), 
// starWars.getSpeciesById(id)


// Код ниже разбирать не нужно. 
// Всё, что вам необходимо знать: эти методы умеют получать данные и возвращают промисы.
// Поробуйте запустить их в своем скрипте search.js.

// Общие свойства для всех сущностей
interface BaseEntity {
  name: string;
  created: string;
  edited: string;
  url: string;
}

interface BaseWithFilms extends BaseEntity {
  films: string[];
}

interface BaseWithMedia extends BaseWithFilms {
  homeworld?: string;
}

interface BaseWithCrew extends BaseEntity {
  crew: string;
  passengers: string;
  consumables: string;
}

interface TransportBase extends BaseEntity {
  model: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  max_atmosphering_speed: string;
  cargo_capacity: string;
}

// конкретные интерфейсы
interface Character extends BaseWithMedia {
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  species: string[];
  vehicles: string[];
  starships: string[];
}

interface Planet extends BaseWithFilms {
  rotation_period: string;
  orbital_period: string;
  diameter: string;
  climate: string;
  gravity: string;
  terrain: string;
  surface_water: string;
  population: string;
  residents: string[];
}

interface Species extends BaseWithMedia {
  classification: string;
  designation: string;
  average_height: string;
  skin_colors: string;
  hair_colors: string;
  eye_colors: string;
  average_lifespan: string;
  language: string;
  people: string[];
}

interface Film extends BaseEntity {
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
}

interface Vehicle extends TransportBase {
  vehicle_class: string;
  pilots: string[];
}

interface Starship extends TransportBase {
  hyperdrive_rating: string;
  MGLT: string;
  starship_class: string;
  pilots: string[];
}

// API дженерик
interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

const starWars = {
  // --- Search Methods ---
  searchCharacters: (query: string): Promise<ApiResponse<Character>> => {
    return fetch(`https://swapi.py4e.com/api/people/?search=${query}`)
      .then((response) => response.json())
      .then((data: ApiResponse<Character>) => data);
  },

  searchPlanets: (query: string): Promise<ApiResponse<Planet>> => {
    return fetch(`https://swapi.py4e.com/api/planets/?search=${query}`)
      .then((response) => response.json())
      .then((data: ApiResponse<Planet>) => data);
  },

  searchSpecies: (query: string): Promise<ApiResponse<Species>> => {
    return fetch(`https://swapi.py4e.com/api/species/?search=${query}`)
      .then((response) => response.json())
      .then((data: ApiResponse<Species>) => data);
  },

  // --- Get By Id Methods ---
  getCharactersById: async (id: number): Promise<Character> => {
    const response = await fetch(`https://swapi.py4e.com/api/people/${id}`);
    return (await response.json()) as Character;
  },

  getPlanetsById: async (id: number): Promise<Planet> => {
    const response = await fetch(`https://swapi.py4e.com/api/planets/${id}`);
    return (await response.json()) as Planet;
  },

  getSpeciesById: async (id: number): Promise<Species> => {
    const response = await fetch(`https://swapi.py4e.com/api/species/${id}`);
    return (await response.json()) as Species;
  },

  getFilmsById: async (id: number): Promise<Film> => {
    const response = await fetch(`https://swapi.py4e.com/api/films/${id}`);
    return (await response.json()) as Film;
  },

  getVehiclesById: async (id: number): Promise<Vehicle> => {
    const response = await fetch(`https://swapi.py4e.com/api/vehicles/${id}`);
    return (await response.json()) as Vehicle;
  },

  getStarshipsById: async (id: number): Promise<Starship> => {
    const response = await fetch(`https://swapi.py4e.com/api/starships/${id}`);
    return (await response.json()) as Starship;
  },
};