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
                checkout scm
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
                branch 'main'
            }
            steps {
                sh 'cp -r dist/. ${WEBROOT}/'
            }
        }
    }

    post {
        success {
            echo "Pipeline passed — branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "Pipeline failed — branch: ${env.BRANCH_NAME}"
        }
        always {
            cleanWs()
        }
    }
}
