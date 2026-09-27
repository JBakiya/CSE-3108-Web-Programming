# Pokémon Field Journal

A simple Pokémon search app built with plain HTML, CSS, and JavaScript.

## What it does
Type a Pokémon's name (or click a quick-search button) and it fetches that
Pokémon's data from the PokeAPI, showing its artwork, types, height, weight,
abilities, and base stats.

## API used
```
GET https://pokeapi.co/api/v2/pokemon/{name}
```

## Files
- `index.html` – page structure
- `style.css` – styling and layout
- `script.js` – fetches the data and updates the page

## How to run
Just open `index.html` in a browser. No install or build step needed.

## Notes
- Handles loading and error states (e.g. misspelled names).
- Works on desktop and mobile.
- No API key required.