# gulp-node-spritesheet [![Build Status](https://travis-ci.org/ngaer/gulp-node-spritesheet.svg?branch=master)](https://travis-ci.org/ngaer/gulp-node-spritesheet) [![NPM version](https://badge.fury.io/js/gulp-node-spritesheet.svg)](http://badge.fury.io/js/gulp-node-spritesheet)

Gulp plugin for [node-spritesheet utility](https://github.com/richardbutler/node-spritesheet)

## Requirements
node-spritesheet utility requires [ImageMagick](http://www.imagemagick.org/script/index.php), available via HomeBrew (`$ sudo brew install ImageMagick`) or MacPorts: (`$ sudo port install ImageMagick`).

## Installation
Install the module with: `npm install gulp-node-spritesheet`

## Usage
    var sprite = require('gulp-node-spritesheet');

    gulp.task('sprite', function() {
        gulp.src('icons/*.png')
        	.pipe(sprite({
                // Path for compiled sprite styles
    			outputCss: 'sprite/style.css',

                // Uses this compound selector in the css, e.g. '.sprite.my-image {}'
    			selector: '.sprite',

                // Name for sprite image file
    			outputImage: 'image.png'
    		}))
    		.pipe(gulp.dest('sprite'));
    });

Takes in a series of images a generates a sprite styles in `sprite/style.css` and passes sprite image `image.png` output.

### Retina example

    var sprite = require('gulp-node-spritesheet');

    gulp.src('images/icons/*.png')
		.pipe(sprite({
			outputCss: './css/sprite.css',
			selector: '.sprite',

            // Optional ImageMagick sampling filter.
            downsampling: "LanczosSharp",

            // Output configurations: in this instance to output two sprite sheets,
            // one for "legacy" (i.e. 72dpi, pixel ratio 1), and "retina" (x2).
            // These keys (legacy, retina) are completely arbitrary.
			output: {
				legacy: {
					pixelRatio: 1,
					outputImage: 'sprite.png',
                    // Optional path to output image
					httpImagePath: '../images/sprite.png'
				},
				retina: {
					pixelRatio: 2,
					outputImage: 'sprite@2x.png',
					httpImagePath: '../images/sprite@2x.png'
				}
			}
            
            // Allows you to augment your selector names for each image, based on
            // the bare image "name", or the full image path.
            resolveImageSelector: function(name, fullpath) {
                // For example, your files may well already be named with @2x, but
                // you won't want that included in your CSS selectors.
                return name.split('@2x').join('');
            }
		}))
		.pipe(gulp.dest('images'));

As the retina scheme has the highest pixel ratio, it will be assumed that all images passed to the plugin are for 'retina'. So, at the output, will be two images `sprite@2x.png` for 'retina' and downscaled `sprite.png` for 'legacy'.

## Release History

 * 2015-09-07   v0.1.1   Minor fixes.
 * 2014-11-14   v0.1.0   First release.

## License
Copyright (c) 2014 Gaer Nikita. Licensed under the MIT license.