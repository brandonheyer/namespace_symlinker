var fs = require( 'fs' ),
    rimraf = require( 'rimraf' ),
    path = require( 'path' ),
    _ = require( 'underscore' ),
    namespace = porcess.argv[ 2 ],
    projectPath = path.resolve( process.argv[ 3 ] ),
    cwd = process.cwd() + '/node_modules/@' + namespace + '/',
    libs = {}, methods = {
        _recurse: {},
        _run: {}
    };

methods.recurse = function( root ) {
    fs.readdir( root, _.partial( methods._recurse.readdir, root ) );
};

methods._recurse.readdir = function( root, err, files ) {
    _.each( files, _.partial( methods._recurse.each, root ) );
};

methods._recurse.each = function( root, file ) {
    fs.lstat( root + file, _.partial( methods._recurse.lstat, root, file ) );
};

methods._recurse.lstat = function( root, file, err, stats ) {
    if ( err ) {
        throw err;
    }

    if ( !stats.isFile() && libs[ file ] ) {
        if ( stats.isSymbolicLink() ) {
            console.log( 'Already symlinked: "' + file + '"');
            methods.recurse( libs[ file ] + '/node_modules/@' + namespace + '/' );
            return;
        }

        rimraf( root + file, _.partial( methods._recurse.rimraf, root, file ) );
    }
}

methods._recurse.rimraf = function( root, file, err ) {
    if ( err ) {
        throw err;
    }

    fs.symlink( libs[ file ], root + file, _.partial( methods._recurse.symlink, file ) );
}

methods._recurse.symlink = function( file ) {
    console.log( 'symlink created "' + file + '" ---> "' + libs[ file ] + '"' );
    methods.recurse( libs[ file ] + '/node_modules/@/' + namespace + '/' );
}

methods.run = function( root ) {
    fs.readdir( root, _.partial( methods._run.readdir, root ) );
};

methods._run.readdir = function( root, err, files ) {
    methods._run.done = _.after( files.length, methods.recurse );

    if ( err ) {
        throw err;
    }

    _.each( files, _.partial( methods._run.each, root ) );
};

methods._run.each = function( root, file ) {
    fs.lstat( root  + '/' + file, _.partial( methods._run.lstat, root, file ) );
};

methods._run.lstat = function( root, file, err, stats ) {
    if ( !err ) {
        if ( stats.isDirectory() ) {
            console.log( 'Namespaced Library Found: ' + file );
            libs[ file ] = path.resolve( root + '/' + file );
        }
    }

    methods._run.done( cwd );
};


methods.run( projectPath );
