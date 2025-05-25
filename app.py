from flask import Flask, render_template
import pygame
import random

app = Flask(__name__)

# Initialize Pygame
pygame.init()

# Load sounds
alarm_sound = pygame.mixer.Sound('static/sounds/alarm.wav')
caution1_sound = pygame.mixer.Sound('static/sounds/caution1.wav')
caution2_sound = pygame.mixer.Sound('static/sounds/caution2.wav')
redflag_sound = pygame.mixer.Sound('static/sounds/redflag.wav')
restart_sound = pygame.mixer.Sound('static/sounds/restart.wav')

# Set up timer
timer_running = False
race_time = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start_timer', methods=['POST'])
def start_timer():
    global race_time, timer_running
    timer_running = True
    race_time = int(request.form['time']) * 60
    random.start_time = random.randint(1, race_time)
    pygame.time.set_timer(pygame.USEREVENT, random.start_time)
    return 'Timer started'

@app.route('/caution', methods=['POST'])
def caution():
    global alarm_sound
    if timer_running:
        if request.form['sound'] == '1':
            alarm_sound.play()
        else:
            alarm_sound = pygame.mixer.Sound('static/sounds/' + request.form['sound'] + '.wav')
            alarm_sound.play()
    return ''

@app.route('/redflag', methods=['POST'])
def redflag():
    global timer_running, race_time
    if timer_running:
        if request.form['action'] == 'pause':
            timer_running = False
        else:
            timer_running = True
        if request.form['sound'] == '1':
            redflag_sound.play()
        else:
            redflag_sound = pygame.mixer.Sound('static/sounds/' + request.form['sound'] + '.wav')
            redflag_sound.play()
    return ''

@app.route('/restart', methods=['POST'])
def restart():
    global timer_running, race_time
    if timer_running:
        timer_running = False
        race_time = 0
        pygame.time.set_timer(pygame.USEREVENT, 0)
        restart_sound.play()
    return ''

if __name__ == '__main__':
    app.run(debug=True)