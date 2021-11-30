var gulp			= require('gulp'),
	autoprefixer	= require('autoprefixer'),
	babel			= require('gulp-babel'),
	browserSync		= require('browser-sync'),
	cleanCSS		= require('gulp-clean-css'),
	concat 			= require('gulp-concat'),
	cssvariables	= require('postcss-css-variables'),
	fs 				= require('fs'),
	minify			= require('gulp-babel-minify'),
	postCSS			= require('gulp-postcss'),
	prompt			= require('gulp-prompt'),
	rename			= require('gulp-rename'),
	rsync			= require('gulp-rsync'),
	sourcemaps      = require('gulp-sourcemaps');


const server = browserSync.create();



// Auto-prefix and compress CSS
gulp.task('styles', () =>
	gulp.src(['src/css/main.css'])
		.pipe(postCSS([ autoprefixer() ]))
		.pipe(cleanCSS({ compatibility: 'ie11' }))
		.pipe(concat('main.min.css'))
		.pipe(gulp.dest('dist/css/'))
);


// Compress JS
gulp.task('scripts', () =>
	gulp.src(['src/js/main.js'])
		.pipe(sourcemaps.init())
		.pipe(babel({presets: ['@babel/env'] }))
		.pipe(minify({
			mangle: {
				keepClassName: true
			},
			builtIns: false
		}))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/js/'))
);



/*********************************************************************
	Deploying and reloading
 *********************************************************************/

// Browsersync
gulp.task('serve', (done) => {
	server.init({ proxy: 'http://localhost:8888/' });
	done();
});

gulp.task('reload', (done) => {
	server.reload();
	done();
});



/*********************************************************************
	Bundled and watch tasks
 *********************************************************************/

gulp.task('watch', () => {
	gulp.watch('src/**/*.css', gulp.series('styles', 'reload'));
	gulp.watch('src/js/*.js', gulp.series('scripts', 'reload'));
	gulp.watch('dist/img/*.{jpg,jpeg,png,svg,gif}', gulp.series('reload'));
	gulp.watch('**/*.php', gulp.series('reload'));
});


gulp.task('dev', gulp.series(gulp.parallel('styles', 'scripts'), 'serve', 'watch'));
gulp.task('build', gulp.series(gulp.parallel('styles', 'scripts')));
gulp.task('default', gulp.series('dev'));



