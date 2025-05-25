// Function to play caution sound
function playCautionSound() {
    var cautionButton = document.getElementById("caution-button");
    if (cautionButton.textContent === "Caution") {
        cautionButton.textContent = "Caution 1";
        document.getElementById("caution-sound").src = "{{ url_for('static', filename='sounds/caution1.wav') }}";
    } else if (cautionButton.textContent === "Caution 1") {
        cautionButton.textContent = "Caution 2";
        document.getElementById("caution-sound").src = "{{ url_for('static', filename='sounds/caution2.wav') }}";
    }
}

// Function to play red flag sound
function playRedFlagSound() {
    var redflagButton = document.getElementById("redflag-button");
    if (redflagButton.textContent === "Red Flag") {
        redflagButton.textContent = "Pause";
        document.getElementById("redflag-sound").src = "{{ url_for('static', filename='sounds/redflag.wav') }}";
    } else if (redflagButton.textContent === "Pause") {
        redflagButton.textContent = "Resume";
        document.getElementById("redflag-sound").src = "{{ url_for('static', filename='sounds/redflag.wav') }}";
    }
}

// Function to restart timer
function restartTimer() {
    var restartButton = document.getElementById("restart-button");
    if (restartButton.textContent === "Restart") {
        restartButton.textContent = "Reset";
        document.getElementById("restart-sound").src = "{{ url_for('static', filename='sounds/restart.wav') }}";
    }
}