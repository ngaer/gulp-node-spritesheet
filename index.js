/*
 * gulp-node-spritesheet
 * https://github.com/ngaer/gulp-node-spritesheet
 *
 * Copyright (c) 2014 Gaer Nikita
 * Licensed under the MIT license.
 */

'use strict';

var gutil = require('gulp-util'),
	through = require('through'),
	sprites = require('node-spritesheet'),
	fs = require('fs'),
	Q = require('q');

module.exports = function(options) {
	var builder,
		builderOptions = {
			images: []
		},
		outputOptions = options.output;

	// get output directory
	if (options.outputCss) {
		var outputMatch = options.outputCss.match(/^(.*?)\/?([^/]*)\.([^/]*)$/);

		if (outputMatch.length > 1) {
			options.outputCss = outputMatch[2] + '.' + outputMatch[3];
			options.outputDirectory = outputMatch[1];
		}
	}

	// create config of allowed options
	[
		'selector',
		'outputCss',
		'outputImage',
		'outputDirectory',
		'downsampling',
		'resolveImageSelector',
		'httpImagePath',
		'filter'
	].forEach(function(option) {
			if (option == 'outputImage' && outputOptions) {
				return;
			}
			if (options[option]) {
				builderOptions[option] = options[option];
			}
		})

	function bufferFiles(file) {
		if (file.isNull()) return;
		file.isStream() && this.emit('error', new PluginError('gulp-node-spritesheet', 'Streams are not supported!'));

		// collect image paths
		builderOptions.images.push(file.path);
	};

	function endStream() {
		var self = this,
			outputFiles = [];

		if (builderOptions.images.length == 0) {
			self.emit('end');
			return;
		}

		builder = new sprites.Builder(builderOptions);

		// add output configurations
		if (outputOptions) {
			for (var key in outputOptions) {
				if (outputOptions.hasOwnProperty(key)) {
					var outputOptionsItem = outputOptions[key];
					builder.addConfiguration(key, outputOptionsItem);
					outputFiles.push(outputOptionsItem.outputImage);
				}
			}
		} else {
			outputFiles.push(options.outputImage);
		}

		builder.build(function() {
			var queue = [];
			/*
			 Plugin node-spritesheet doesn't support streaming of compiled files, it can just save it in fs by
			 configuration. So to make it more 'gulp way', we read this compiled files and push it to a stream, and
			 remove files form fs after.
			 */
			outputFiles.forEach(function(file) {
				var filePath = options.outputDirectory + '/' + file,
					deferred = Q.defer();

				fs.readFile(filePath, function(err, data) {
					if (err) {
						self.emit('error', new PluginError('gulp-node-spritesheet', err));
					}
					if (data) {
						fs.unlink(filePath, function (err) {
							if (err) throw err;
						});
						self.emit('data', new gutil.File({
							cwd: options.outputDirectory,
							base: options.outputDirectory,
							path: filePath,
							contents: data
						}));
					}
					deferred.resolve();
				});

				queue.push(deferred.promise);
			});

			Q.all(queue).then(function() {
				self.emit('end');
			});
		});
	};

	return through(bufferFiles, endStream);
};
