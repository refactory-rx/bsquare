module.exports = function(grunt) {
    
    require("load-grunt-tasks")(grunt);
    
    grunt.initConfig({
        
        copy: {
            shared: {
                files: [
                    { 
                        expand: true,
                        cwd: "../shared",
                        src: ["alt/*.js", "alt/**/*.js"],
                        dest: "client/typings"
                    }
                ]
            }
        },

        babel: {
            options: {
                sourceMap: true
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "client/js/",
                        src: ["*.js", "*/**/*.js"],
                        dest: "client/dist/"
                    }
                ]
            }
        },

        ts: {
            default: {
                files: [
                    { src: ["client/ts/*.ts"], dest: "client/dist/ng2" }
                ],
                options: {
                    experimentalDecorators: true,
                    module: "commonjs",
                    fast: "never",
                    target: "es5"
                }
            }
        },

        concat: {
            js: {
                src: [
                    "client/dist/main.js",
                    "client/dist/translate.js",
                    "client/dist/directives.js",
                    "client/dist/services/stringUtils.js",
                    "client/dist/services/validationService.js",
                    "client/dist/controllers/event/eventEntry.js",
                    "client/dist/controllers/event/front/eventFront.js",
                    "client/dist/controllers/event/back/manageEvent.js",
                    "client/dist/controllers/event/back/tickets/manageTickets.js",
                    "client/dist/controllers/event/back/info/manageInfo.js",
                    "client/dist/controllers/event/back/layout/manageLayout.js",
                    "client/dist/controllers/event/back/signup/manageSignup.js",
                    "client/dist/controllers/event/back/marketing/manageMarketing.js",
                    "client/dist/controllers/event/back/orders/manageOrders.js",
                    "client/dist/controllers/event/back/dashboard/dashboard.js",
                    "client/dist/controllers/event/back/dashboard/ticketsChart.js",
                    "client/dist/controllers/event/back/dashboard/revenueChart.js",
                    "client/dist/controllers/event/back/payout/payout.js",
                    "client/dist/controllers/event/back/guests/guests.js",
                    "client/dist/controllers/ticket/ticket.js",
                    "client/dist/controllers/order/order.js",
                    "client/dist/controllers/app/app.js",
                    "client/dist/controllers/app/myEvent.js",
                    "client/dist/controllers/app/quickEditEvent.js",
                    "client/dist/controllers/app/myEvents.js",
                    "client/dist/controllers/app/myTickets.js",
                    "client/dist/controllers/app/findEvents.js",
                    "client/dist/controllers/app/logreg.js",
                    "client/dist/controllers/app/settings.js",
                    "client/dist/controllers/verify.js",
                    "client/dist/controllers/user.js",
                    "client/dist/controllers/pwdRecovery.js",
                    "client/dist/controllers/front.js"
                ],
                dest: "client/dist/source.js"
            }
        },
        
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            js: {
                files: {
                    "client/dist/source.js": ["client/dist/source.js"]
                }
            }
        },
        
        uglify: {
            dev: {
                options: {
                    sourceMap: true
                },
                files: {
                    "client/dist/source.min.js": ["client/dist/source.js"]
                }
            },
            server: {
                files: {
                    "client/dist/source.min.js": ["client/dist/source.js"]
                }
            }
        },

        watch: {
            es6: {
                files: ["client/js/**/*.js", "client/ts/*.ts", "../shared/alt/**/*.js"],
                tasks: ["babel", "ts", "concat", "ngAnnotate", "uglify:dev"]
            }
        },
        
        nodemon: {
            dev: {
                script: "server.js",
                options: {
                    exec: "npm run babel-node",
                    watch: ["server.js", "server", "lib", "../bsquare-tickets/server", "../bsquare-auth"]
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
