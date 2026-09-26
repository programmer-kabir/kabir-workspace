import wave
import math
import random
import struct
import os

SOUNDS_DIR = r"c:\ROSCA\assets\sounds"
os.makedirs(SOUNDS_DIR, exist_ok=True)

def create_wav(filename, duration, generator_func):
    filepath = os.path.join(SOUNDS_DIR, filename)
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(2) # Stereo
        wav_file.setsampwidth(2) # 16-bit PCM
        wav_file.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(n_samples):
            t = i / sample_rate
            left, right = generator_func(t, duration)
            
            # Master limiter
            left = max(-0.95, min(0.95, left))
            right = max(-0.95, min(0.95, right))
            
            int_left = int(left * 32767)
            int_right = int(right * 32767)
            frames.extend(struct.pack('<hh', int_left, int_right))
        
        wav_file.writeframes(frames)
    print(f"Generated: {filepath} ({duration}s)")

# 1. Standing Ovation & Whistling
def gen_standing_ovation(t, dur):
    # Envelope: 0.5s fade in, sustain to dur-0.8s, fade out
    if t < 0.5:
        env = t / 0.5
    elif t > dur - 0.8:
        env = max(0, (dur - t) / 0.8)
    else:
        env = 1.0
        
    # Density noise claps
    noise_l = (random.random() * 2 - 1)
    noise_r = (random.random() * 2 - 1)
    
    # Layer periodic clap bursts
    clap_impulse = 0
    for rate in [12, 17, 23, 29, 34]:
        phase = (t * rate) % 1.0
        if phase < 0.08:
            clap_impulse += math.sin(phase / 0.08 * math.pi) * (random.random() * 0.4 + 0.6)
            
    # Crowd whistles
    whistle = 0
    if 0.6 < t < 1.8:
        wf = 2800 + 400 * math.sin(t * 18)
        whistle += 0.15 * math.sin(2 * math.pi * wf * t) * math.sin((t-0.6)/1.2 * math.pi)
    if 1.5 < t < 2.7:
        wf2 = 3200 + 500 * math.cos(t * 22)
        whistle += 0.12 * math.sin(2 * math.pi * wf2 * t) * math.sin((t-1.5)/1.2 * math.pi)

    l = (noise_l * 0.35 + clap_impulse * 0.25 + whistle) * env
    r = (noise_r * 0.35 + clap_impulse * 0.25 + whistle) * env
    return l, r

# 2. Party & Festival Celebration
def gen_party_festival(t, dur):
    env = 1.0 if t < dur - 0.5 else (dur - t) / 0.5
    
    # Party Horn Fanfare (0.0s to 1.2s)
    horn = 0
    if t < 1.2:
        freqs = [523.25, 659.25, 783.99, 1046.50] # C major chord
        for f in freqs:
            # Triangular wave
            phase = (t * f) % 1.0
            val = 4 * abs(phase - 0.5) - 1.0
            horn += val * 0.1
        horn *= math.sin(t / 1.2 * math.pi)
        
    # Whistle slide
    whistle = 0
    if 0.5 < t < 2.0:
        slide_f = 1200 + (t - 0.5) * 1500
        whistle = 0.2 * math.sin(2 * math.pi * slide_f * t) * math.sin((t-0.5)/1.5 * math.pi)
        
    # Applause noise
    noise_l = (random.random() * 2 - 1) * 0.3
    noise_r = (random.random() * 2 - 1) * 0.3
    
    l = (horn + whistle + noise_l) * env
    r = (horn + whistle + noise_r) * env
    return l, r

# 3. Drumroll & Victory Cheer
def gen_drumroll_cheer(t, dur):
    # Drumroll from 0.0s to 2.0s
    drumroll = 0
    crash = 0
    applause_start = 1.8
    
    if t < 2.0:
        # Increasing frequency roll
        roll_rate = 15 + (t / 2.0) * 35 # acceleration
        phase = (t * roll_rate) % 1.0
        if phase < 0.25:
            noise = (random.random() * 2 - 1)
            drumroll = noise * math.sin(phase / 0.25 * math.pi) * (0.2 + 0.8 * (t / 2.0))
            
    # Cymbal Crash at 1.9s
    if t >= 1.9:
        crash_t = t - 1.9
        crash_noise = (random.random() * 2 - 1)
        crash_env = math.exp(-crash_t * 2.5)
        crash = crash_noise * crash_env * 0.5
        
    # Swelling Cheer from 1.8s onwards
    applause = 0
    if t >= 1.8:
        app_t = t - 1.8
        app_env = min(1.0, app_t / 0.4) * max(0, (dur - t) / 0.8)
        applause = (random.random() * 2 - 1) * 0.4 * app_env
        
    l = (drumroll * 0.4 + crash + applause)
    r = (drumroll * 0.4 + crash + applause)
    return l, r

# 4. Golden Bell & Jackpot Cheer
def gen_golden_bell(t, dur):
    env = 1.0 if t < dur - 0.6 else (dur - t) / 0.6
    
    # Ringing Bells (Chimes at t=0, t=0.2, t=0.4, t=0.6)
    bell = 0
    bell_times = [0.0, 0.2, 0.4, 0.6, 0.9, 1.2]
    bell_freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0, 3135.96]
    for bt, bf in zip(bell_times, bell_freqs):
        if t >= bt:
            dt = t - bt
            bell_env = math.exp(-dt * 4.0)
            bell += 0.15 * math.sin(2 * math.pi * bf * dt) * bell_env
            
    # Background cheering applause
    applause_l = (random.random() * 2 - 1) * 0.35 * env
    applause_r = (random.random() * 2 - 1) * 0.35 * env
    
    l = (bell + applause_l) * env
    r = (bell + applause_r) * env
    return l, r

# 5. Magical Sparkle & Crowd Wave
def gen_magical_sparkle(t, dur):
    env = 1.0 if t < dur - 0.6 else (dur - t) / 0.6
    
    # Ascending sparkle scale
    sparkle = 0
    if t < 1.8:
        scale_notes = [523, 659, 784, 1046, 1318, 1568, 2093, 2637, 3136, 4186]
        note_idx = int((t / 1.8) * len(scale_notes))
        note_idx = min(note_idx, len(scale_notes) - 1)
        freq = scale_notes[note_idx]
        sparkle = 0.2 * math.sin(2 * math.pi * freq * t) * (1.0 - (t / 1.8) * 0.3)
        
    applause_l = (random.random() * 2 - 1) * 0.35
    applause_r = (random.random() * 2 - 1) * 0.35
    
    l = (sparkle + applause_l) * env
    r = (sparkle + applause_r) * env
    return l, r

if __name__ == "__main__":
    create_wav("applause_standing_ovation.wav", 3.5, gen_standing_ovation)
    create_wav("applause_party_festival.wav", 3.2, gen_party_festival)
    create_wav("applause_drumroll_cheer.wav", 4.0, gen_drumroll_cheer)
    create_wav("applause_golden_bell.wav", 3.5, gen_golden_bell)
    create_wav("applause_magical_sparkle.wav", 3.5, gen_magical_sparkle)
    print("All audio files generated successfully!")
