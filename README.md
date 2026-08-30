# avg-calc

A small client-side web app for calculating a weighted undergraduate average.

Add each course's name, credit points, and grade, then click **Calculate** to
get the credit-weighted average:

```
average = sum( (credits / total_credits) * grade )
```

Courses are saved to the browser's `localStorage`, so your list persists
between visits (in the same browser).

## Running it

No build step required — just open [index.html](index.html) in a browser,
or serve the folder with any static file server, e.g.:

```
npx serve .
```
