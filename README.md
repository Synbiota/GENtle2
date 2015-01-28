<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [GENtle refactor](#gentle-refactor)
  - [Getting started](#getting-started)
    - [Installation](#installation)
    - [Running the servers](#running-the-servers)
    - [Recompiling assets](#recompiling-assets)
      - [Stylesheets](#stylesheets)
      - [Javascripts](#javascripts)
      - [Continuous compilation](#continuous-compilation)
    - [Running specs](#running-specs)
      - [Installation](#installation-1)
      - [Running the server](#running-the-server)
  - [Server](#server)
  - [App](#app)
    - [Directory structure and primary files](#directory-structure-and-primary-files)
    - [Core vendor dependencies](#core-vendor-dependencies)
      - [Backbone](#backbone)
      - [Underscore](#underscore)
      - [Handlebars](#handlebars)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# GENtle refactor

## Getting started

### Installation

In order to run GENtle locally in development mode, you need to follow these
steps:

1. Install node in version `^0.11`. See [n](https://github.com/visionmedia/n) 
  for managing node versions. Version `^0.11` is necessary because we use 
  [koa](koajs.com) which relies on ES6
1. Install the `node-foreman` and `nodemon` node packages globally

    ```shell
    npm install -g foreman nodemon
    ```
  
1. Install local npm packages

    ```shell
    npm install
    ```

1. Install rubygems dependencies* (you'll need Ruby installed locally,
preferrably using `rbenv`)

    ```shell
    bundle install
    ```

_*While unfortunate, the ruby dependencies lets us import JSON files in SCSS
stylesheets using [SassyJSON](https://github.com/HugoGiraudel/SassyJSON)._


### Running the servers

Run both the GENtle server and the documentation server

```shell
npm start
```

Doc will be accessible at [http://localhost:8082](http://localhost:8082). It
will be automatically refreshed when comments in source files are modified.

GENtle will be accessible at [http://localhost:8081](http://localhost:8081)

### Recompiling assets

All compilation tasks use [grunt](http://gruntjs.com) and are defined in 
`gruntfile.js`. 

#### Stylesheets

Stylesheets are writen in [SCSS](http://sass-lang.com). To compile new changes, 
run:

```shell
grunt css
```

#### Javascripts

We use [browserify](https://github.com/substack/node-browserify) to precompile
templates, transform ES6 files and generate the bundle, `app.min.js`.

To generate an unminified bundle, run:

```shell 
grunt js
```

To generate a minified bundle, run:

```shell
grunt js:min
```

The compiled script (`public/scripts/app.min.js`) is ignored by git. 

__The app is automatically compiled and minified when deploying via the `postinstall` npm hook.__

#### Continuous compilation

To automatically recompile assets when sources change, run:

```shell
# Watch and recompile everything
grunt w 
# Watch and recompile stylesheets
grunt watch:css 
# Watch and recompile javascripts
grunt browserify:watch
```

JS continuous compilation uses watchify which makes it very quick to update when 
files changes.

### Running specs

We use [Karma](https://karma-runner.github.io) to run specs written using
[Jasmine](https://jasmine.github.io/2.0/introduction.html).

Specs are run in PhantomJS so all happens in the CLI.

#### Installation

1. Install `karma` and dependencies globally `npm install -g karma karma-phantomjs-launcher karma-requirejs karma-cli karma-jasmine`
2. Install `phantomjs` globally `npm install -g phantomjs`

#### Running the server

1. Run `karma start` once to start the server
2. Run `karma run` to run the specs. 

## Server

We use [koa](koajs.com) to route and serve the assets. For now, there is only
one route: `routes/index.js`, serving the `views/index.jade` [jade](http://jade-lang.com)
file.

Any change to koa routes or views will trigger a refresh of the server 
since we use `nodemon`.


## App

The app itself uses `browserify` to load the different 
source files and manage dependency injection.

We now use the [ES6 module syntax](http://24ways.org/2014/javascript-modules-the-es6-way/) to load modules. 
Legacy modules using AMD-syntax are still compatible.

Non-NPM module aliases are defined in the `package.json` file.

### Directory structure and primary files

The app (living in `public/scripts/`) in organised in modules, which will help when developing plugins (not
yet implemented).

| File/directory      | Comment                                       |
| ---                 | ---                                           |
| `common/`           | common lib and backbone components            |
| `sequence/`         | main sequence view module                     |
| `app.js`            | instantiates and starts the app               |
| `router.js`         | defines app routes                            |


Each module directory has the following structure:

| Directory    | Comment                                                                   |
| ---          | ---                                                                       |
| `lib/`       | Non-backbone sources                                                      |
| `models/`    | Backbone model and collections. Used to manage data.                      |
| `templates/` | Handlebar templates                                                       |
| `views/`     | Backbone views. Populate templates based on model and handles interaction |

### Core vendor dependencies

#### Backbone

We use [backbone](http://backbonejs.org) along with the following plugins:

* [layoutmanager](http://layoutmanager.org) to handle nested views
* [deepmodel](https://github.com/powmedia/backbone-deep-model) to handle nested
  attributes in models, as a simpler alternative to formal associations

To ensure backbone dependencies are properly loaded in your files, require 
`backbone.mixed` instead of `backbone`.

```js
import Backbone from 'backbone.mixed';
var Backbone = require('backbone.mixed');
```

#### Underscore

[Underscore](http://underscorejs.org) is a backbone dependency but also 
quite a powerful tool. Custom methods are defined in `common/lib/underscore.mixed.js`.

To ensure custom methods are properly mixed in, require `underscore.mixed` instead
of `underscore`.

```js
import _ from 'underscore.mixed';
var _ = require('underscore.mixed');
```

#### Handlebars

We use [Handlebars](http://handlebarsjs.com) for templating in the app.

Helpers are defined in `common/lib/handlebar.mixed.js` and loaded automatically.

To require and precompile a template, just require/import the html file.

```js
import template from '../templates/sidebar_view.html';
var template = require('../templates/sidebar_view.html');
```









