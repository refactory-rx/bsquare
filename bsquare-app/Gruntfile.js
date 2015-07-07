module.exports = function(grunt) {
    
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        
        babel: {
            options: {
                sourceMap: true
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "client/js/",
                        src: ["*.js"],
                        dest: "client/dist/"
                    }
                ]
            }
        },
        
        watch: {
            es6: {
                files: ["client/js/**/*.js"],
                tasks: ["babel"]
            }
        },
        
        nodemon: {
            dev: {
                script: "server.js",
                options: {
                    exec: "npm run babel-node",
                    watch: ["server.js", "server"]
                }
            },
        },

        concurrent: {
            dev: {
                tasks: ["nodemon", "watch"],
                options: {
                    logConcurrentOutput: true
                }
            }
        }

    });
    
    grunt.registerTask("default", ["babel", "concurrent:dev"]);

};
