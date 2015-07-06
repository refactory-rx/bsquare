module.exports = function(grunt) {
    
    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        
        "babel": {
            options: {
                sourceMap: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: "client/js",
                    src: ["*/**/*.js"],
                    dest: "client/dist"
                }]
            }
        }

    });

    grunt.registerTask("default", ["babel"]);

};
