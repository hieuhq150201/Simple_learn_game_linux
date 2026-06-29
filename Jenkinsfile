pipeline {
    agent any

    options {
        disableConcurrentBuilds(abortPrevious: true)
        timeout(time: 15, unit: 'MINUTES')
    }

    environment {
        BUN     = '/home/trung/.bun/bin/bun'
        WEBROOT = '/var/www/html'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'git@github.com:hieuhq150201/Simple_learn_game_linux.git',
                        credentialsId: 'github-ssh-key'
                    ]]
                ])
            }
        }

        stage('Install') {
            steps {
                sh '${BUN} install --frozen-lockfile'
            }
        }

        stage('Test') {
            steps {
                sh '${BUN} test'
            }
        }

        stage('Build') {
            steps {
                sh '${BUN} run build'
            }
        }

        stage('Deploy') {
            when {
                expression {
                    return env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main'
                }
            }
            steps {
                sh 'cp -r dist/. ${WEBROOT}/'
            }
        }
    }

    post {
        success {
            echo "Pipeline passed — branch: ${env.GIT_BRANCH}"
        }
        failure {
            echo "Pipeline failed — branch: ${env.GIT_BRANCH}"
        }
        always {
            cleanWs()
        }
    }
}
