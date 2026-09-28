# Bitcoin Observatory

A responsive, animated website for the Bitcoin DAE project. The site uses standard HTML, CSS and JavaScript and runs without a backend, API key, build step or external dependencies.

## Preview locally

From this directory run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Use a local server rather than opening index.html directly, because the hero loads its data from a JSON file.

## Included

- Continuously animated historical price cover chart with a moving data point, 30-day moving average, range controls, replay and keyboard/touch inspection.
- Dedicated Dataset view explaining the row meaning, source columns, historical period and project workflow.
- Animated source-data statistics.
- Original dashboard and all ten Matplotlib images extracted from DAE_PROJECT.ipynb.
- Image enlargement, PNG downloads, chart ZIP download and source CSV download.
- Responsive navigation and layouts, reduced-motion support and keyboard controls.

## Data provenance

The hero and analytical text use the original coin_Bitcoin.csv source: 2,991 observations from 2013-04-29 to 2021-07-06. The JSON contains daily close, a full-window trailing 30-observation moving average, and source-derived summary statistics. Values are historical, not live quotes. Returns mean (Close - Open) / Open * 100. Volatility uses sample standard deviation. An increased day means Close > Open; the source contains one unchanged day.

The original Matplotlib images are preserved exactly. They include the notebook's median-imputation artifacts and 1.10% average intraday return. The site explains this difference. Replacing these images with corrected notebook exports will require updating their captions and the data note. The notebook itself was not changed.

## Main files

- dist/index.html — page content
- dist/styles.css — responsive styling and motion
- dist/app.js — interactive chart, image viewer and UI
- dist/assets/data.json — original-source series and metrics
- dist/assets/source_bitcoin.csv — original source dataset
- dist/assets/*.png — original notebook visualizations

The original notebook and original CSV in Downloads were not modified.
