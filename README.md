# World tour

https://observablehq.com/@d3/world-tour@274

View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/d/0e9181d646defd6c@274.tgz?v=3
~~~

Then, import your notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "@d3/world-tour";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~

## GitHub Pages deployment

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the static site to GitHub Pages whenever changes are pushed to the `main` branch or when the workflow is manually dispatched. To enable publishing:

1. Ensure Pages is set to deploy from GitHub Actions under **Settings → Pages**.
2. Push changes to `main` (or manually trigger the workflow) and allow the workflow to upload the site artifact and deploy.
3. Visit the environment URL shown in the workflow summary to view the live page.
