/* Prevent double-tap zooming on iOS */
document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) event.preventDefault();
  lastTouchEnd = now;
}, false);

const STORAGE_KEY = 'bbtd-logbook-v1';

let kalimbaSynth = null;
function getSynth() {
  if (!kalimbaSynth) {
    try {
      kalimbaSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.02, release: 0.3 }
      }).toDestination();
      kalimbaSynth.volume.value = -6;
    } catch (e) {
      console.warn("Audio not initialized:", e);
    }
  }
  return kalimbaSynth;
}

function playChime(note = 523.25, duration = 0.2) {
  try {
    if (Tone.context.state !== 'running') Tone.start();
    const s = getSynth();
    if (s) s.triggerAttackRelease(note, duration);
  } catch (err) {}
}

function playSetCompletedSound() {
  playChime(659.25, 0.25);
  setTimeout(() => playChime(783.99, 0.3), 60);
}

const PROGRAM_SPLIT = [
  {
    day: 1,
    title: "Back & Posterior Trunk",
    focus: "Latissimus dorsi width, scapular retraction, and erector density.",
    volume: "22–25 Working Sets",
    exercises: [
      { id: "d1_1", name: "Reverse Cable / Machine Flyes", target: "Rear Delts & Rhomboids", sets: 5, reps: "12–15+", cue: "Protracted scapulae; hold peak contraction for 2s." },
      { id: "d1_2", name: "Wide-Grip Lat Pulldowns", target: "Latissimus Dorsi", sets: 5, reps: "12–15+", cue: "Drive elbows down toward clavicle; zero swinging." },
      { id: "d1_3", name: "Single-Arm DB Rows", target: "Lats & Lower Traps", sets: 4, reps: "12–15+", cue: "Deep stretch at bottom; sweep backward toward hip." },
      { id: "d1_4", name: "Supported T-Bar Rows", target: "Mid-Trapezius", sets: 4, reps: "12+", cue: "Pronated grip; 1-second static pause at peak." },
      { id: "d1_5", name: "Bent-Over Barbell Rows", target: "Posterior Chain", sets: 4, reps: "12+", cue: "Strict 45-degree hip hinge; no knee dip." },
      { id: "d1_6", name: "Hyperextensions or Shrugs", target: "Erectors & Traps", sets: 4, reps: "15–20", cue: "Fluid tempo; do not hyperextend cervical spine." }
    ]
  },
  {
    day: 2,
    title: "Chest (Pectoralis Complex)",
    focus: "Clavicular head priority, sternal adduction & continuous tension.",
    volume: "20–24 Working Sets",
    exercises: [
      { id: "d2_1", name: "Incline Barbell Bench Press", target: "Upper Pecs", sets: 5, reps: "12", cue: "Stop 2 inches above chest; avoid locking joints." },
      { id: "d2_2", name: "Flat Barbell Bench Press", target: "Mid Pecs", sets: 5, reps: "12", cue: "Controlled cadence; no bouncing off rib cage." },
      { id: "d2_3", name: "Incline DB or Machine Press", target: "Upper Pecs / Anterior", sets: 4, reps: "10–12", cue: "Pyramid load; final set to clean concentric failure." },
      { id: "d2_4", name: "Standing Cable Crossovers", target: "Sternal Pecs", sets: 5, reps: "16–20", cue: "Slight forward torso lean; cross wrists at peak." },
      { id: "d2_5", name: "Piana 30-Rep Machine Burnout", target: "Complete Girdle", sets: 2, reps: "30", cue: "Unbroken piston cadence for maximum lactate pooling." }
    ]
  },
  {
    day: 3,
    title: "Legs (Hamstrings Pre-Exhaust)",
    focus: "Pre-exhausting knee flexors buffers patellofemoral joints.",
    volume: "24–28 Working Sets",
    exercises: [
      { id: "d3_1", name: "Lying Leg Curls", target: "Hamstrings", sets: 4, reps: "12–15+", cue: "3-second eccentric; feet dorsiflexed." },
      { id: "d3_2", name: "Single-Leg Curls", target: "Unilateral Hamstrings", sets: 4, reps: "12+", cue: "Alternate legs continuously with zero rest." },
      { id: "d3_3", name: "Stiff-Legged Deadlifts", target: "Hamstrings & Glutes", sets: 5, reps: "12", cue: "Hinge hips deep backward until a full hamstring stretch." },
      { id: "d3_4", name: "Leg Extensions", target: "Quadriceps", sets: 4, reps: "15–20", cue: "Toes straight; steady cadence to induce local burn." },
      { id: "d3_5", name: "45-Degree Leg Press", target: "Quads & Glutes", sets: 4, reps: "12–20", cue: "Narrow foot position; do not lockout knees." },
      { id: "d3_6", name: "Hack Squats or Back Squats", target: "Vastus Lateralis", sets: 5, reps: "12", cue: "Clean depth; smooth reversal with no bottom bounce." }
    ]
  },
  {
    day: 4,
    title: "Deltoids & Upper Traps",
    focus: "Prioritizing lateral head abduction over heavy overhead pressing.",
    volume: "26–30 Working Sets",
    exercises: [
      { id: "d4_1", name: "Standing DB Lateral Raises", target: "Lateral Deltoids", sets: 5, reps: "12–15+", cue: "Lead with elbows; subtle internal rotation at peak." },
      { id: "d4_2", name: "Machine Overhead Press", target: "Anterior Delts", sets: 4, reps: "12+", cue: "Reverse direction at ear level to maintain load." },
      { id: "d4_3", name: "Reverse Pec Deck Flyes", target: "Posterior Deltoids", sets: 5, reps: "15–20", cue: "Wide arc; avoid excessive scapular squeeze." },
      { id: "d4_4", name: "Piana 40-Rep Deltoid Giant Set", target: "Deltoid Triad", sets: 3, reps: "40", cue: "10 front raises + 10 lateral raises + 20 rear raises nonstop." },
      { id: "d4_5", name: "Heavy Trap Shrugs", target: "Upper Traps", sets: 5, reps: "12–15", cue: "Pure vertical elevation; 2s pause at top." }
    ]
  },
  {
    day: 5,
    title: "Arms Antagonistic Supersets",
    focus: "Reciprocal innervation; rapid alternation of flexor and extensor.",
    volume: "24–30 Working Sets",
    exercises: [
      { id: "d5_1", name: "Superset 1A: Triceps Pushdowns", target: "Triceps Lateral", sets: 4, reps: "12–15+", cue: "Elbows pinned; flare wrists slightly at base." },
      { id: "d5_2", name: "Superset 1B: Single Cable Curls", target: "Biceps Peak", sets: 4, reps: "12–15+", cue: "Continuous cable tension; full supination." },
      { id: "d5_3", name: "Superset 2A: Overhead Rope Ext.", target: "Triceps Long Head", sets: 4, reps: "12", cue: "Deep stretch behind neck; spread rope at top." },
      { id: "d5_4", name: "Superset 2B: Incline DB Curls", target: "Biceps Outer Head", sets: 4, reps: "12–15", cue: "Arms hang freely; deep stretch before curling." },
      { id: "d5_5", name: "Superset 3A: Close-Grip Bench", target: "Triceps", sets: 4, reps: "10–12", cue: "Shoulder-width grip; elbows tucked close." },
      { id: "d5_6", name: "Superset 3B: Standing Hammer Curls", target: "Brachialis", sets: 4, reps: "12–15", cue: "Neutral thumb grip; strict control without body sway." }
    ]
  },
  {
    day: 6,
    title: "Distal Extremities (Calves & Forearms)",
    focus: "High-repetition century sets for stubborn postural muscle beds.",
    volume: "16–20 Working Sets",
    exercises: [
      { id: "d6_1", name: "Leg Press Calf Century Sets", target: "Calf Complex", sets: 4, reps: "100", cue: "Continuous reps; 3-second lockout rest only if failing." },
      { id: "d6_2", name: "Seated Calf Raises", target: "Soleus Priority", sets: 4, reps: "20–25", cue: "2-second stretch pause; drive high onto toes." },
      { id: "d6_3", name: "Seated BB Wrist Curls", target: "Forearm Flexors", sets: 5, reps: "20–30", cue: "Roll down fingertips, curl upward to peak." },
      { id: "d6_4", name: "Standing Reverse Wrist Curls", target: "Forearm Extensors", sets: 5, reps: "20–30", cue: "Light weight, strict upward extension." }
    ]
  },
  {
    day: 7,
    title: "Active Regeneration & LISS",
    focus: "Nutrient hyper-compensation, LISS clearance, zero microtrauma.",
    volume: "Regeneration",
    exercises: [
      { id: "d7_1", name: "LISS Recumbent Cycling", target: "Appetite & Recovery", sets: 1, reps: "35 Mins", cue: "Maintain HR 100–120 BPM for gastric emptying." },
      { id: "d7_2", name: "Full-Body Passive Mobility", target: "Fascial Stretching", sets: 3, reps: "15 Mins", cue: "Relaxed stretching for pecs, lats, and hips." },
      { id: "d7_3", name: "Morning & Evening Vacuums", target: "Transverse Abdominis", sets: 4, reps: "15s Holds", cue: "Counters abdominal distension from large food intake." }
    ]
  }
];

const SULEK_SPLIT = [
  { day: 1, tab: "Chest", title: "Chest & Side Delts", focus: "Incline pressing first, then a chest pump, then a lot of side-delt work. Take most sets to failure around rep 10.", volume: "19–22 Working Sets", exercises: [
    { id: "sk1_1", name: "Incline Barbell Bench Press", target: "Upper Chest", sets: 4, reps: "8–12", cue: "Upper chest first. Slow the eccentric. Make the last set a drop set." },
    { id: "sk1_2", name: "Hammer Strength Chest Press", target: "Pecs", sets: 3, reps: "8–12", cue: "Press to failure, then 2–3 lengthened partials." },
    { id: "sk1_3", name: "Smith Machine Incline Press", target: "Upper Chest", sets: 2, reps: "8–10", cue: "Stable overload. Add load if every rep is easy." },
    { id: "sk1_4", name: "Pec Deck", target: "Pecs", sets: 2, reps: "12–15", cue: "Deep stretch, hard squeeze. Drop the last set." },
    { id: "sk1_5", name: "Cable Fly", target: "Pecs", sets: 2, reps: "12–15", cue: "Constant tension. Cross the hands slightly at the peak." },
    { id: "sk1_6", name: "Dumbbell Lateral Raise", target: "Side Delts", sets: 5, reps: "15–20", cue: "Elbows lead. Go to failure, then partials on the last sets." },
    { id: "sk1_7", name: "Machine Lateral Raise", target: "Side Delts", sets: 3, reps: "15–20", cue: "No swing. Keep tension on the side delt the whole time." }
  ]},
  { day: 2, tab: "Back", title: "Back & Rear Delts", focus: "Vertical pulls for width, rows for thickness, then rear delts. Full range, then partials once full reps die.", volume: "18–20 Working Sets", exercises: [
    { id: "sk2_1", name: "Barbell Row", target: "Back Thickness", sets: 4, reps: "8–12", cue: "Brace hard. Stretch at the bottom. Drop set on the last set." },
    { id: "sk2_2", name: "Lat Pulldown", target: "Lats", sets: 3, reps: "8–12", cue: "Full hang into a hard contraction. Take the set to failure." },
    { id: "sk2_3", name: "Single-Arm Pulldown", target: "Lats", sets: 3, reps: "8–12", cue: "Drive the elbow toward the hip. Assist with the free hand only after failure." },
    { id: "sk2_4", name: "Seated Cable Row", target: "Mid Back", sets: 3, reps: "8–12", cue: "V-bar or wide grip. Two-second squeeze, chest tall." },
    { id: "sk2_5", name: "Reverse Pec Deck", target: "Rear Delts", sets: 4, reps: "12–15", cue: "Rear delts, not a shrug. Wide arc, stop before the traps take over." },
    { id: "sk2_6", name: "Face Pull", target: "Rear Delts", sets: 3, reps: "12–15", cue: "Finish with external rotation. Squeeze the rear delts." }
  ]},
  { day: 3, tab: "Arms", title: "Arms", focus: "Alternate triceps and biceps. Cables and machines so you can fail the muscle, not the grip. Slow eccentrics.", volume: "20–22 Working Sets", exercises: [
    { id: "sk3_1", name: "Underhand Cable Pressdown", target: "Triceps", sets: 3, reps: "12–15", cue: "Elbows pinned. Slow eccentric all the way to a stretch." },
    { id: "sk3_2", name: "Alternating Dumbbell Curl", target: "Biceps", sets: 3, reps: "8–12", cue: "Supinate as you curl. No sway. Squeeze at the top." },
    { id: "sk3_3", name: "Single-Arm Overhead Extension", target: "Triceps Long Head", sets: 3, reps: "12–15", cue: "Deep stretch behind the head. Control the bottom." },
    { id: "sk3_4", name: "EZ-Bar or Cable Preacher Curl", target: "Biceps", sets: 3, reps: "10–12", cue: "Upper arm glued to the pad. Full stretch, no bounce." },
    { id: "sk3_5", name: "Dip Machine", target: "Triceps", sets: 3, reps: "8–12", cue: "Hard squeeze at the bottom. Add partials after full reps fail." },
    { id: "sk3_6", name: "Straight-Bar Cable Curl", target: "Biceps", sets: 2, reps: "10–12", cue: "Constant cable tension. Elbows stay in front of the ribs." },
    { id: "sk3_7", name: "Straight-Bar Pressdown", target: "Triceps", sets: 2, reps: "12–15", cue: "Lock the elbows to your sides and push to failure." },
    { id: "sk3_8", name: "Spider Curl", target: "Biceps", sets: 2, reps: "12–15", cue: "Chest on the pad. Shorten the range only after you truly fail." }
  ]},
  { day: 4, tab: "Legs", title: "Legs", focus: "Hamstring curls before squatting. Heel-elevated squats and extensions for quads. Calves if they are not already sore.", volume: "22–24 Working Sets", exercises: [
    { id: "sk4_1", name: "Seated Leg Curl", target: "Hamstrings", sets: 4, reps: "12–15", cue: "Hamstrings first. Three-second eccentric, full stretch." },
    { id: "sk4_2", name: "Single-Leg Seated Curl", target: "Hamstrings", sets: 3, reps: "12–15", cue: "Alternate legs with almost no rest." },
    { id: "sk4_3", name: "Lying Leg Curl", target: "Hamstrings", sets: 2, reps: "12–15", cue: "Hips stay glued to the pad. Do not bounce out of the stretch." },
    { id: "sk4_4", name: "Heel-Elevated Squat", target: "Quads", sets: 3, reps: "8–12", cue: "Barbell, hack, or Smith. Heels up to bias quads. Take it to failure." },
    { id: "sk4_5", name: "Leg Extension", target: "Quads", sets: 4, reps: "12–20", cue: "Squeeze the top. Lengthened partials on the last set." },
    { id: "sk4_6", name: "Sissy Squat", target: "Quads", sets: 3, reps: "8–12", cue: "Bodyweight. Control the bottom. Stop if the knees complain." },
    { id: "sk4_7", name: "Seated Calf Raise", target: "Calves", sets: 4, reps: "12–20", cue: "Pause in the stretch. Skip the day if calves are still wrecked." }
  ]}
];
const CUTLER_SPLIT = [
  { day: 1, tab: "Delts", title: "Shoulders, Triceps & Abs", focus: "Monday of his 2008 Olympia week. Laterals before any press, then triceps from a stretch to lockout, then abs. About 60 seconds between sets. Wednesday is off.", volume: "49 Working Sets", exercises: [
    { id: "jc1_1", name: "Dumbbell Lateral Raise", target: "Side Delts", sets: 3, reps: "10–12", cue: "Lead with the elbows. Stop the swing. Squeeze the side delt at the top." },
    { id: "jc1_2", name: "Seated Dumbbell Overhead Press", target: "Delts", sets: 3, reps: "10–12", cue: "Press for the delt, not a max. Control the negative. Do not bounce out of the bottom." },
    { id: "jc1_3", name: "Cable Side Delt Raise", target: "Side Delts", sets: 3, reps: "8–12", cue: "Constant tension. Pause the peak. This is a good place for an FST-7 finisher if you want one." },
    { id: "jc1_4", name: "Barbell Front Raise", target: "Front Delts", sets: 2, reps: "8–12", cue: "Strict. Stop around shoulder height so the traps do not take the last third." },
    { id: "jc1_5", name: "Bent-Over Dumbbell Lateral Raise", target: "Rear Delts", sets: 3, reps: "8–12", cue: "Chest down, soft elbows. Lift out to the sides and squeeze the rear delt." },
    { id: "jc1_6", name: "Cable Overhead Triceps Extension", target: "Triceps", sets: 4, reps: "15", cue: "Deep stretch behind the head. Lock out and squeeze. Keep the elbows narrow." },
    { id: "jc1_7", name: "One-Arm Overhead Triceps Extension", target: "Triceps", sets: 3, reps: "15", cue: "Same stretch, one arm at a time. Do not let the elbow flare." },
    { id: "jc1_8", name: "Close-Grip Bench Press", target: "Triceps", sets: 3, reps: "8", cue: "Hands just inside shoulder width. Elbows tucked. Leave a little in the tank. This is not a max bench." },
    { id: "jc1_9", name: "French Press", target: "Triceps", sets: 3, reps: "8", cue: "Lying EZ-bar extension. Elbows stay pointed at the ceiling. Lower to the forehead or just behind it." },
    { id: "jc1_10", name: "Dumbbell Kickbacks", target: "Triceps", sets: 3, reps: "12", cue: "Upper arm parallel to the floor. Squeeze the lockout. No swinging." },
    { id: "jc1_11", name: "Straight-Torso Dips", target: "Triceps", sets: 3, reps: "15", cue: "Torso upright so the triceps do the work. Stop if the shoulders complain." },
    { id: "jc1_12", name: "Shrugs", target: "Upper Traps", sets: 4, reps: "12", cue: "Straight up and down. Hold the top. Do not roll the shoulders." },
    { id: "jc1_13", name: "Bodyweight Crunches", target: "Abs", sets: 3, reps: "20", cue: "Short range. Ribs toward the pelvis. Do not yank the neck." },
    { id: "jc1_14", name: "Rope Crunch", target: "Abs", sets: 3, reps: "20", cue: "Hips stay still. Curl the torso down and squeeze." },
    { id: "jc1_15", name: "Hanging Leg Raise", target: "Abs", sets: 3, reps: "12", cue: "Posterior tilt first, then lift. No swing." },
    { id: "jc1_16", name: "Lying Leg Lifts", target: "Abs", sets: 3, reps: "10", cue: "Low back stays down. Lower with control." }
  ]},
  { day: 2, tab: "Back", title: "Back", focus: "Tuesday. Width, then thickness, then one heavy pull. Rest 2–4 minutes on the deadlift only. Everything else stays near 60 seconds.", volume: "25 Working Sets", exercises: [
    { id: "jc2_1", name: "Wide-Grip Front Lat Pulldown", target: "Lats", sets: 3, reps: "8–12", cue: "Full stretch at the top. Drive the elbows toward the hips. Squeeze the lats, not the biceps." },
    { id: "jc2_2", name: "One-Arm Dumbbell Row", target: "Back", sets: 3, reps: "8–12", cue: "Stretch at the bottom, pull toward the hip, pause. No torso twist." },
    { id: "jc2_3", name: "Bent-Over Barbell Row", target: "Back", sets: 4, reps: "8–12", cue: "Hinge and brace. Pull to the lower ribs. Control the eccentric." },
    { id: "jc2_4", name: "Conventional Deadlift", target: "Posterior Chain", sets: 3, reps: "8–10", cue: "The heavy strength work of the week. Rest 2–4 minutes if you need it. Brace, then stand tall. Do not bounce the plates." },
    { id: "jc2_5", name: "Close-Grip T-Bar Row", target: "Mid Back", sets: 3, reps: "8–12", cue: "Chest up. Squeeze the mid back at the top for a second." },
    { id: "jc2_6", name: "Behind-the-Neck Pulldown", target: "Lats", sets: 3, reps: "8–12", cue: "This is in his published Tuesday. Pull only to the base of the neck. Stop the set if the shoulders pinch, and use a front pulldown instead." },
    { id: "jc2_7", name: "Seated Cable Row", target: "Mid Back", sets: 3, reps: "8–12", cue: "Sit tall. Stretch the arms, then pull the handle to the stomach and squeeze." },
    { id: "jc2_8", name: "Hyperextension", target: "Erectors", sets: 3, reps: "8–12", cue: "Hinge from the hips. Come up to a straight line. Do not crank the lower back into a deep arch." }
  ]},
  { day: 3, tab: "Chest", title: "Chest, Biceps & Forearms", focus: "Thursday, not Wednesday. Incline press first, then flyes and a decline, then high-rep arms and abs. Feel the muscle. Do not turn the presses into a max-out.", volume: "48 Working Sets", exercises: [
    { id: "jc3_1", name: "Incline Barbell Bench Press", target: "Upper Chest", sets: 5, reps: "10–12", cue: "Upper chest first. Touch high on the chest, press up and slightly back. Control every negative." },
    { id: "jc3_2", name: "Flat Dumbbell Bench Press", target: "Chest", sets: 3, reps: "8–10", cue: "Deep stretch at the bottom. Do not clang the dumbbells. Leave the lockout soft." },
    { id: "jc3_3", name: "Incline Dumbbell Fly", target: "Chest", sets: 3, reps: "8–10", cue: "Soft elbows. Open until the pecs stretch, then squeeze the bells together." },
    { id: "jc3_4", name: "Cable Crossover", target: "Chest", sets: 3, reps: "12", cue: "Constant tension. Cross the hands slightly and hold the squeeze. A natural FST-7 finisher." },
    { id: "jc3_5", name: "Decline Barbell Bench Press", target: "Lower Chest", sets: 3, reps: "8", cue: "Lower under control. Press for the lower pec, not an ego load." },
    { id: "jc3_6", name: "Straight-Bar Curl", target: "Biceps", sets: 5, reps: "15", cue: "Elbows pinned. Full stretch, hard squeeze. No sway." },
    { id: "jc3_7", name: "Alternating Dumbbell Curl", target: "Biceps", sets: 3, reps: "12", cue: "Supinate as you curl. Lower for a full two seconds." },
    { id: "jc3_8", name: "Single-Arm Preacher Curl", target: "Biceps", sets: 3, reps: "10", cue: "Arm glued to the pad. Stop just short of locking the elbow on the way down." },
    { id: "jc3_9", name: "Hammer Curl", target: "Brachialis", sets: 2, reps: "12–15", cue: "Neutral grip. Elbows stay at your sides." },
    { id: "jc3_10", name: "Reverse Curl", target: "Forearms", sets: 6, reps: "15", cue: "Overhand grip. Curl without letting the wrists collapse." },
    { id: "jc3_11", name: "Bodyweight Crunches", target: "Abs", sets: 3, reps: "20", cue: "Same short crunch as Monday. Quality over speed." },
    { id: "jc3_12", name: "Kneeling Cable Crunch", target: "Abs", sets: 3, reps: "20", cue: "Kneel and curl the spine. Hips stay put." },
    { id: "jc3_13", name: "Hanging Leg Raise", target: "Abs", sets: 3, reps: "12", cue: "Posterior tilt, then lift. No kipping." },
    { id: "jc3_14", name: "Lying Leg Raise", target: "Abs", sets: 3, reps: "10", cue: "Lower slowly. Keep the lower back on the bench." }
  ]},
  { day: 4, tab: "Quads", title: "Quadriceps", focus: "Friday. A light extension to warm the quads, then press and squat, then a heavier extension. Rest longer only on the heavy squats.", volume: "18 Working Sets", exercises: [
    { id: "jc4_1", name: "Leg Extension (light)", target: "Quads", sets: 3, reps: "20", cue: "Pre-exhaust and warmup. Light load, full squeeze, no lockout slam." },
    { id: "jc4_2", name: "Leg Press", target: "Quads", sets: 4, reps: "12", cue: "Feet lower on the platform to bias quads. Do not bounce the sled off the stops." },
    { id: "jc4_3", name: "Back Squat", target: "Quads", sets: 4, reps: "6–10", cue: "The heavy sets of the day. Rest 2–4 minutes if the bar is truly heavy. Brace, hit a clean depth, and stand up without a bounce." },
    { id: "jc4_4", name: "Forward Lunge", target: "Quads", sets: 3, reps: "8/leg", cue: "Short step, front heel down, torso tall. Eight reps each leg." },
    { id: "jc4_5", name: "Leg Extension (heavy)", target: "Quads", sets: 4, reps: "10", cue: "Heavier than the warmup sets. Pause the squeeze. This is the pump finisher, and a fair place for FST-7." }
  ]},
  { day: 5, tab: "Hams", title: "Hamstrings, Calves & Abs", focus: "Saturday. Hamstrings first, then calves from standing to seated, then abs. Sunday is off.", volume: "36 Working Sets", exercises: [
    { id: "jc5_1", name: "Lying Leg Curl", target: "Hamstrings", sets: 6, reps: "12", cue: "Hips glued down. Full stretch, hard squeeze. Do not heave the weight up." },
    { id: "jc5_2", name: "Romanian Deadlift", target: "Hamstrings", sets: 3, reps: "10", cue: "Soft knees, hips back, bar close. Stop when the hamstrings stretch. Do not turn it into a max pull." },
    { id: "jc5_3", name: "Single-Leg Hamstring Curl", target: "Hamstrings", sets: 3, reps: "12", cue: "One leg at a time. Match the weaker side. A good FST-7 candidate." },
    { id: "jc5_4", name: "Leg Press, Feet High and Wide", target: "Hamstrings & Glutes", sets: 3, reps: "12", cue: "Feet high and wide. Push through the heels. Do not lock the knees hard." },
    { id: "jc5_5", name: "Standing Calf Raise", target: "Calves", sets: 4, reps: "10", cue: "Pause the stretch at the bottom, then rise all the way up." },
    { id: "jc5_6", name: "Donkey Calf Raise", target: "Calves", sets: 2, reps: "10", cue: "Hips hinged, stretch deep, squeeze the top. A leg-press calf raise works if there is no donkey machine." },
    { id: "jc5_7", name: "Seated Calf Raise", target: "Calves", sets: 3, reps: "10", cue: "Soleus. Two-second stretch at the bottom." },
    { id: "jc5_8", name: "Bodyweight Crunches", target: "Abs", sets: 3, reps: "20", cue: "Same crunch as the other ab days." },
    { id: "jc5_9", name: "Kneeling Cable Crunch", target: "Abs", sets: 3, reps: "20", cue: "Curl the spine. Do not sit back onto the heels." },
    { id: "jc5_10", name: "Hanging Leg Raise", target: "Abs", sets: 3, reps: "12", cue: "Control both directions." },
    { id: "jc5_11", name: "Lying Leg Raise", target: "Abs", sets: 3, reps: "10", cue: "Lower slowly. Low back stays down." }
  ]}
];
function repeatStations(stations, rounds) {
  const out = [];
  for (let r = 0; r < rounds; r++) stations.forEach((s) => out.push(Object.assign({ round: r + 1, rounds: rounds }, s)));
  return out;
}
function emomPhases(minutes) {
  return minutes.map((m, i) => ({ type: "work", seconds: 60, round: i + 1, rounds: minutes.length, name: m.name, detail: m.detail, cue: m.cue }));
}
function hiitBlocks(workSec, restSec, rounds, workMeta, restMeta, restAfterLast) {
  const phases = [];
  for (let i = 0; i < rounds; i++) {
    phases.push(Object.assign({ type: "work", seconds: workSec, round: i + 1, rounds: rounds }, workMeta(i)));
    if (restSec > 0 && (restAfterLast || i < rounds - 1)) phases.push(Object.assign({ type: "rest", seconds: restSec, round: i + 1, rounds: rounds }, restMeta(i)));
  }
  return phases;
}
function stationPhases(stations, workSec, restSec) {
  const phases = [];
  stations.forEach((s, i) => {
    phases.push({ type: "work", seconds: workSec, round: i + 1, rounds: stations.length, name: s.name, detail: s.detail, cue: s.cue });
    if (restSec > 0 && i < stations.length - 1) {
      phases.push({ type: "rest", seconds: restSec, round: i + 1, rounds: stations.length, name: "Transition", detail: "Next: " + stations[i + 1].name, cue: "Move during these 10 seconds. The next station starts on the chime." });
    }
  });
  return phases;
}
const EMOM_SPLIT = [
  { day: 1, tab: "Strength", kind: "emom", title: "12-Minute Strength EMOM", focus: "Every minute on the minute. Start the reps at the chime and rest whatever time is left. If you cannot finish inside the minute, the load is too heavy. Squat, press, and row, four times through.", volume: "12:00", phases: emomPhases(repeatStations([
    { name: "Goblet or Front Squat", detail: "6–8 reps", cue: "Brace, sit to a real depth, and stand tall. Leave at least 15 seconds." },
    { name: "Push-up or Dumbbell Press", detail: "8–12 reps", cue: "Chest to the floor on the push-up, or a controlled dumbbell press. No bouncing." },
    { name: "One-Arm Dumbbell Row", detail: "8–10 each arm", cue: "Both arms inside the same minute. Brace on the bench and pull toward the hip." }
  ], 4)) },
  { day: 2, tab: "Burpees", kind: "emom", title: "10-Minute Burpee EMOM", focus: "A straight conditioning EMOM. Eight burpees at the top of every minute for 10 minutes. You want about 15 seconds in hand before the next chime. Drop to 5 burpees if 8 does not leave that rest.", volume: "10:00", phases: emomPhases(Array.from({ length: 10 }, (_, i) => ({ name: "Burpees", detail: "8 reps · minute " + (i + 1), cue: "Chest and thighs to the floor, then jump and clap overhead. Step back if jumping bothers the joints. Stop the workout if a minute cannot be finished." }))) },
  { day: 3, tab: "Ascend", kind: "emom", title: "Ascending Squat EMOM", focus: "The Death By format, capped at 10 minutes so it has an end. Minute 1 is 1 squat, minute 2 is 2 squats, and so on up to 10. Miss the minute and the piece is over.", volume: "10:00", phases: emomPhases(Array.from({ length: 10 }, (_, i) => ({ name: "Air Squat", detail: (i + 1) + " rep" + (i === 0 ? "" : "s"), cue: "The reps match the minute number. Full depth, own the stand. If this minute spills past the chime, you are done." }))) }
];
const HICT_STATIONS = [
  { name: "Jumping Jacks", detail: "30 seconds", cue: "Total-body opener. Land softly and keep the arms moving the whole 30 seconds." },
  { name: "Wall Sit", detail: "30 seconds", cue: "Thighs near parallel, back flat on the wall. The source article says to swap this isometric out if you have high blood pressure or heart disease." },
  { name: "Push-up", detail: "30 seconds", cue: "Body in one line. Drop to the knees if the last reps fall apart." },
  { name: "Abdominal Crunch", detail: "30 seconds", cue: "Short range. Ribs toward the pelvis. Do not yank the neck." },
  { name: "Step-up onto a Chair", detail: "30 seconds", cue: "Whole foot on the chair. Switch the lead leg halfway. Hold a rail if you need it." },
  { name: "Squat", detail: "30 seconds", cue: "Sit down and stand up. Knees track over the toes." },
  { name: "Triceps Dip on a Chair", detail: "30 seconds", cue: "Hands on the seat, hips close to the chair. Bend the elbows and press back up." },
  { name: "Plank", detail: "30 seconds", cue: "Forearms or hands. Ribs and hips quiet. Skip this isometric with the same caution as the wall sit." },
  { name: "High Knees", detail: "30 seconds", cue: "Run in place. Knees up, land softly, keep breathing." },
  { name: "Lunge", detail: "30 seconds", cue: "Alternate legs. Back knee toward the floor, torso tall." },
  { name: "Push-up and Rotation", detail: "30 seconds", cue: "Push up, rotate, and reach one arm to the ceiling. Alternate sides." },
  { name: "Side Plank", detail: "30 seconds", cue: "One side for this station. Switch sides if you repeat the circuit. Skip it if isometrics are a problem for you." }
];
const HIIT_SPLIT = [
  { day: 1, tab: "Tabata", kind: "hiit", title: "Tabata Bike, 20/10", focus: "Izumi Tabata’s 1996 protocol, on a bike. Seven or eight 20-second pieces at an effort that would empty you in about 50 seconds of continuous pedaling, with 10 seconds between. If you sail past eight, add resistance. Burpees were not the studied workout.", volume: "4:00", phases: hiitBlocks(20, 10, 8,
    () => ({ name: "Bike, hard", detail: "20 seconds", cue: "Stay at about 90 rpm. This piece should feel close to failure by the 7th or 8th round." }),
    () => ({ name: "Coast", detail: "10 seconds", cue: "Stay on the bike. Breathe. The next piece starts at the chime." }),
    true) },
  { day: 2, tab: "10×60", kind: "hiit", title: "Gibala 10 × 60 Seconds", focus: "Martin Gibala’s practical model: ten 60-second efforts at about 85–90% of max heart rate, with 60 seconds easy between them. Bike or rower. The session ends on the 10th hard minute.", volume: "19:00", phases: hiitBlocks(60, 60, 10,
    () => ({ name: "Hard minute", detail: "85–90% max heart rate", cue: "Hard, but not an all-out sprint. You should still complete all 10." }),
    () => ({ name: "Easy minute", detail: "Light spin or row", cue: "Keep moving. The recovery is part of the protocol." })) },
  { day: 3, tab: "4×4", kind: "hiit", title: "Helgerud 4×4", focus: "Jan Helgerud’s 2007 treadmill protocol, which you can run, row, or ride. Four minutes at 90–95% max heart rate, three minutes easy at about 70%, four times. The study also used a 10-minute easy warm-up and a 3-minute easy cool-down.", volume: "25:00", phases: hiitBlocks(240, 180, 4,
    () => ({ name: "Hard 4 minutes", detail: "90–95% max heart rate", cue: "Settle onto the pace in the first minute, then hold it. This is hard breathing, not a sprint." }),
    () => ({ name: "Easy 3 minutes", detail: "About 70% max heart rate", cue: "Keep moving. Do not sit down." })) },
  { day: 4, tab: "15/15", kind: "hiit", title: "Helgerud 15/15", focus: "The other interval group in that same 2007 study. Forty-seven rounds of 15 seconds at 90–95% max heart rate and 15 seconds easy at about 70%. Run, row, or bike. Warm up easy for 10 minutes first.", volume: "23:15", phases: hiitBlocks(15, 15, 47,
    () => ({ name: "Hard 15 seconds", detail: "90–95% max heart rate", cue: "Fast, smooth, and repeatable. You have 47 of these." }),
    () => ({ name: "Easy 15 seconds", detail: "About 70% max heart rate", cue: "Active rest. Stay tall and keep the machine moving." })) },
  { day: 5, tab: "7 Min", kind: "hiit", title: "Klika & Jordan 7-Minute Circuit", focus: "The 2013 ACSM Health & Fitness Journal circuit from Brett Klika and Chris Jordan. Twelve bodyweight stations, 30 seconds on and 10 seconds to move. One lap is about 8 minutes. They say to repeat it 2 or 3 times if you have the time. Swap the wall sit, plank, and side plank for moving exercises if you have high blood pressure or heart disease.", volume: "7:50", phases: stationPhases(HICT_STATIONS, 30, 10) }
];
const SULEK_FEEDINGS = ["Breakfast", "Post-cardio", "Lunch", "Intra", "Dinner"];
const CUTLER_FEEDINGS = ["Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5", "Meal 6"];
const PROGRAM_META = {
  bbtd: { kicker: "Microcycle Log · Switch", title: "Bigger By The Day", documentTitle: "Bigger By The Day • Daily Logbook", overviewHeading: "Microcycle Overview", ritualsLabel: "Rituals" },
  sulek: { kicker: "4-Day Rotation · Switch", title: "Sam Sulek", documentTitle: "Sam Sulek • Daily Logbook", overviewHeading: "Rotation Overview", ritualsLabel: "Daily" },
  cutler: { kicker: "Olympia Split · Switch", title: "Jay Cutler", documentTitle: "Jay Cutler • Daily Logbook", overviewHeading: "Olympia Week", ritualsLabel: "Daily" },
  emom: { kicker: "Every Minute · Switch", title: "EMOM", documentTitle: "EMOM • Daily Logbook", overviewHeading: "EMOM Workouts", ritualsLabel: "Session" },
  hiit: { kicker: "Intervals · Switch", title: "HIIT", documentTitle: "HIIT • Daily Logbook", overviewHeading: "HIIT Workouts", ritualsLabel: "Session" }
};
function blankMeals() { return [false, false, false, false, false, false, false, false]; }
function blankFeedings() { return [false, false, false, false, false]; }
function blankCutlerFeedings() { return [false, false, false, false, false, false]; }
function defaultBbtdProtocols(date) { return { vac1:false, vac2:false, vac3:false, liss:false, feeder:false, feederType:"arms", meals: blankMeals(), nocturnal:false, protocolDate: date }; }
function defaultSulekProtocols(date) { return { liss:false, failure:false, partials:false, dropset:false, restDay:false, feedings: blankFeedings(), protocolDate: date }; }
function defaultCutlerProtocols(date) { return { cardio:false, shortRest:false, pump:false, fst7:false, feedings: blankCutlerFeedings(), protocolDate: date }; }
function defaultEmomProtocols(date) { return { insideMinute:false, scaled:false, finished:false, protocolDate: date }; }
function defaultHiitProtocols(date) { return { hard:false, easyRest:false, finished:false, protocolDate: date }; }
function defaultBucket(id) {
  if (id === "sulek") return { currentDay: 1, logs: {}, autoRest: true, timerDuration: 90, protocols: defaultSulekProtocols(null) };
  if (id === "cutler") return { currentDay: 1, logs: {}, autoRest: true, timerDuration: 60, protocols: defaultCutlerProtocols(null) };
  if (id === "emom") return { currentDay: 1, logs: {}, autoRest: true, timerDuration: 60, protocols: defaultEmomProtocols(null) };
  if (id === "hiit") return { currentDay: 1, logs: {}, autoRest: true, timerDuration: 60, protocols: defaultHiitProtocols(null) };
  return { currentDay: 1, logs: {}, autoRest: true, timerDuration: 60, protocols: defaultBbtdProtocols(null) };
}
const AppState = {
  programId: "bbtd", activeTab: "workout", weight: 242.0,
  byProgram: { bbtd: defaultBucket("bbtd"), sulek: defaultBucket("sulek"), cutler: defaultBucket("cutler"), emom: defaultBucket("emom"), hiit: defaultBucket("hiit") },
  timer: { duration: 60, targetTimestamp: null, intervalId: null, isRunning: false, pausedRemaining: 60 },
  vacuum: { targetTimestamp: null, intervalId: null, isRunning: false, duration: 15 }
};
function prog() { return AppState.byProgram[AppState.programId]; }
function activeSplit() {
  if (AppState.programId === "sulek") return SULEK_SPLIT;
  if (AppState.programId === "cutler") return CUTLER_SPLIT;
  if (AppState.programId === "emom") return EMOM_SPLIT;
  if (AppState.programId === "hiit") return HIIT_SPLIT;
  return PROGRAM_SPLIT;
}
function isIntervalDay(dayData) { return !!(dayData && (dayData.kind === "emom" || dayData.kind === "hiit")); }

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function normalizeBbtdProtocols(raw) {
  const base = defaultBbtdProtocols(raw && raw.protocolDate ? raw.protocolDate : null);
  const next = Object.assign({}, base, raw || {});
  if (!Array.isArray(next.meals) || next.meals.length !== 8) next.meals = blankMeals();
  if (!next.feederType) next.feederType = "arms";
  return next;
}
function normalizeSulekProtocols(raw) {
  const base = defaultSulekProtocols(raw && raw.protocolDate ? raw.protocolDate : null);
  const next = Object.assign({}, base, raw || {});
  if (!Array.isArray(next.feedings) || next.feedings.length !== 5) next.feedings = blankFeedings();
  return next;
}
function normalizeCutlerProtocols(raw) {
  const base = defaultCutlerProtocols(raw && raw.protocolDate ? raw.protocolDate : null);
  const next = Object.assign({}, base, raw || {});
  if (!Array.isArray(next.feedings) || next.feedings.length !== 6) next.feedings = blankCutlerFeedings();
  return next;
}
function normalizeEmomProtocols(raw) {
  const base = defaultEmomProtocols(raw && raw.protocolDate ? raw.protocolDate : null);
  return Object.assign({}, base, raw || {});
}
function normalizeHiitProtocols(raw) {
  const base = defaultHiitProtocols(raw && raw.protocolDate ? raw.protocolDate : null);
  return Object.assign({}, base, raw || {});
}
function restoreBucket(id, raw, normalize) {
  if (!raw) return defaultBucket(id);
  return {
    currentDay: raw.currentDay || 1,
    logs: raw.logs || {},
    autoRest: raw.autoRest !== false,
    timerDuration: raw.timerDuration || (id === "sulek" ? 90 : 60),
    protocols: normalize(raw.protocols)
  };
}
function persistState() {
  try {
    prog().timerDuration = AppState.timer.duration;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), programId: AppState.programId, weight: AppState.weight, byProgram: AppState.byProgram }));
  } catch (e) { console.warn("Persist failed", e); }
}
function applyTimerFromProgram() {
  const duration = prog().timerDuration || (AppState.programId === "sulek" ? 90 : 60);
  AppState.timer.duration = duration;
  AppState.timer.pausedRemaining = duration;
  AppState.timer.isRunning = false;
  AppState.timer.targetTimestamp = null;
}
function hydrateState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.weight === "number") AppState.weight = data.weight;
    if (data.version === 2 && data.byProgram) {
      AppState.programId = PROGRAM_META[data.programId] ? data.programId : "bbtd";
      AppState.byProgram.bbtd = restoreBucket("bbtd", data.byProgram.bbtd, normalizeBbtdProtocols);
      AppState.byProgram.sulek = restoreBucket("sulek", data.byProgram.sulek, normalizeSulekProtocols);
      AppState.byProgram.cutler = restoreBucket("cutler", data.byProgram.cutler, normalizeCutlerProtocols);
      AppState.byProgram.emom = restoreBucket("emom", data.byProgram.emom, normalizeEmomProtocols);
      AppState.byProgram.hiit = restoreBucket("hiit", data.byProgram.hiit, normalizeHiitProtocols);
    } else {
      AppState.programId = "bbtd";
      const bucket = AppState.byProgram.bbtd;
      if (data.currentDay) bucket.currentDay = data.currentDay;
      if (data.logs) bucket.logs = data.logs;
      if (typeof data.autoRest === "boolean") bucket.autoRest = data.autoRest;
      if (typeof data.timerDuration === "number") bucket.timerDuration = data.timerDuration;
      if (data.protocols) bucket.protocols = normalizeBbtdProtocols(data.protocols);
    }
    applyTimerFromProgram();
  } catch (e) { console.warn("Hydrate failed", e); }
}
function maybeResetDailyProtocols() {
  const today = todayKey();
  let changed = false;
  ["bbtd", "sulek", "cutler", "emom", "hiit"].forEach((id) => {
    const bucket = AppState.byProgram[id];
    if (bucket.protocols.protocolDate === today) return;
    if (id === "sulek") bucket.protocols = defaultSulekProtocols(today);
    else if (id === "cutler") bucket.protocols = defaultCutlerProtocols(today);
    else if (id === "emom") bucket.protocols = defaultEmomProtocols(today);
    else if (id === "hiit") bucket.protocols = defaultHiitProtocols(today);
    else {
      const feederType = bucket.protocols.feederType || "arms";
      bucket.protocols = defaultBbtdProtocols(today);
      bucket.protocols.feederType = feederType;
    }
    changed = true;
  });
  if (changed) persistState();
}

function exportBackup() {
  persistState();
  const raw = localStorage.getItem(STORAGE_KEY) || '{}';
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bbtd-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  playChime(659.25, 0.25);
}

function importBackup(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      hydrateState();
      maybeResetDailyProtocols();
      refreshAfterProgramChange(false);
      playChime(783.99, 0.3);
      alert('Backup imported successfully.');
    } catch (err) {
      alert('Could not import that backup file.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

window.addEventListener('DOMContentLoaded', () => {
  hydrateState();
  maybeResetDailyProtocols();
  refreshAfterProgramChange(false);
});

function applyProgramChrome() {
  const meta = PROGRAM_META[AppState.programId];
  document.getElementById('header-kicker').textContent = meta.kicker;
  document.getElementById('header-title').textContent = meta.title;
  document.title = meta.documentTitle;
  document.getElementById('overview-heading').textContent = meta.overviewHeading;
  document.getElementById('nav-label-protocols').textContent = meta.ritualsLabel;
  document.getElementById('rituals-bbtd').classList.toggle('hidden', AppState.programId !== 'bbtd');
  document.getElementById('rituals-sulek').classList.toggle('hidden', AppState.programId !== 'sulek');
  document.getElementById('rituals-cutler').classList.toggle('hidden', AppState.programId !== 'cutler');
  document.getElementById('rituals-emom').classList.toggle('hidden', AppState.programId !== 'emom');
  document.getElementById('rituals-hiit').classList.toggle('hidden', AppState.programId !== 'hiit');
  document.getElementById('auto-timer-check').checked = prog().autoRest;
  renderSplitOverview();
}
function renderSplitOverview() {
  const interval = AppState.programId === "emom" || AppState.programId === "hiit";
  document.getElementById('split-overview').innerHTML = activeSplit().map((d) => `<div class="pt-1.5 flex justify-between gap-3"><span class="shrink-0">${interval ? d.tab : "Day " + d.day}</span><span class="font-medium text-ink text-right">${d.title}</span></div>`).join('');
}
function refreshAfterProgramChange(resetTimer) {
  if (resetTimer) {
    if (AppState.timer.intervalId) clearInterval(AppState.timer.intervalId);
    applyTimerFromProgram();
    const toggle = document.getElementById('timer-toggle-btn');
    if (toggle) toggle.textContent = 'Start Rest';
    dismissRestPill();
    resetSessionClock(true);
  }
  const split = activeSplit();
  if (!split.some((d) => d.day === prog().currentDay)) prog().currentDay = split[0].day;
  document.getElementById('header-weight-val').textContent = AppState.weight.toFixed(1);
  applyProgramChrome();
  renderDayTabs();
  renderCurrentWorkout();
  if (AppState.programId === 'bbtd') {
    renderMealsGrid();
    setFeederType(prog().protocols.feederType || 'arms', true);
  } else if (AppState.programId === 'sulek') renderSulekFeedings();
  else if (AppState.programId === 'cutler') renderCutlerFeedings();
  updateProtocolsUI();
  syncTimerDisplays();
  persistState();
}
function openProgramModal() { applyProgramChrome(); document.getElementById('program-modal').classList.remove('hidden'); }
function closeProgramModal() { document.getElementById('program-modal').classList.add('hidden'); }
function selectProgram(id) {
  if (!PROGRAM_META[id]) return;
  if (id !== AppState.programId) { playChime(440, 0.12); AppState.programId = id; refreshAfterProgramChange(true); }
  closeProgramModal();
}


function renderDayTabs() {
  const container = document.getElementById('day-tabs');
  container.innerHTML = '';
  activeSplit().forEach(item => {
    const isCurrent = item.day === prog().currentDay;
    const btn = document.createElement('button');
    btn.className = `tactile-btn flex-1 py-1.5 px-2 rounded-2xl text-xs font-semibold border transition-all ${
      isCurrent
        ? 'bg-surface border-borderWarm text-terracotta shadow-tile'
        : 'bg-surfaceWarm/70 border-transparent text-inkMuted hover:text-ink'
    }`;
    btn.innerHTML = item.kind ? item.tab : (item.tab ? `<span class="block text-[9px] uppercase font-bold text-inkFaint">D${item.day}</span>${item.tab}` : `<span class="block text-[9px] uppercase font-bold text-inkFaint">D</span>${item.day}`);
    btn.onclick = () => {
      playChime(440, 0.1);
      prog().currentDay = item.day;
      persistState();
      renderDayTabs();
      renderCurrentWorkout();
    };
    container.appendChild(btn);
  });
}

function renderCurrentWorkout() {
  const dayData = activeSplit().find(d => d.day === prog().currentDay) || activeSplit()[0];
  document.getElementById('session-day-num').textContent = `Day ${dayData.day} • ${dayData.volume}`;
  document.getElementById('session-title').textContent = dayData.title;
  document.getElementById('session-focus').textContent = dayData.focus;
  const progressLabel = document.getElementById('session-progress-label');
  if (progressLabel) progressLabel.textContent = isIntervalDay(dayData) ? (dayData.kind === 'emom' ? 'Minute clock' : 'Interval clock') : 'Completed sets';
  if (isIntervalDay(dayData)) {
    renderIntervalWorkout(dayData);
    return;
  }

  const list = document.getElementById('exercises-container');
  list.innerHTML = '';

  dayData.exercises.forEach((ex) => {
    if (!prog().logs[ex.id]) {
      prog().logs[ex.id] = [];
      for (let i = 0; i < ex.sets; i++) {
        prog().logs[ex.id].push({ weight: '', reps: parseInt(ex.reps) || 12, done: false });
      }
      persistState();
    }

    const card = document.createElement('div');
    card.className = "bg-surface rounded-3xl border border-borderWarm p-3.5 shadow-cozy space-y-2.5";

    let html = `
      <div class="flex items-start justify-between">
        <div class="pr-2">
          <span class="text-[10px] font-bold text-inkFaint uppercase tracking-wider">${ex.target}</span>
          <h3 class="text-sm font-bold text-ink leading-snug">${ex.name}</h3>
          <div class="text-[11px] text-inkMuted font-medium">${ex.sets} Sets × ${ex.reps} Reps</div>
        </div>
        <button onclick="toggleCue('${ex.id}')" class="tactile-btn p-1.5 rounded-xl bg-surfaceWarm text-inkMuted hover:text-terracotta border border-borderSubtle">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
      </div>
      <div id="cue-${ex.id}" class="hidden text-xs text-inkMuted bg-surfaceWarm/80 p-2.5 rounded-2xl border border-borderSubtle leading-relaxed">
        <strong class="text-terracotta">Form Cue:</strong> ${ex.cue}
      </div>
      <div class="space-y-1.5 pt-0.5">
        <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-inkFaint px-1">
          <span class="col-span-2">Set</span>
          <span class="col-span-5 text-center">Lbs</span>
          <span class="col-span-3 text-center">Reps</span>
          <span class="col-span-2 text-right">Done</span>
        </div>
    `;

    prog().logs[ex.id].forEach((set, idx) => {
      const isDone = set.done;
      html += `
        <div class="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-2xl border transition-all ${
          isDone ? 'bg-sageSoft/70 border-sage/30' : 'bg-surfaceWarm/60 border-borderSubtle'
        }">
          <span class="col-span-2 text-xs font-semibold ${isDone ? 'text-sage' : 'text-inkMuted'}">#${idx + 1}</span>
          <div class="col-span-5 flex justify-center">
            <input type="number" placeholder="—" value="${set.weight}" onchange="updateSetVal('${ex.id}', ${idx}, 'weight', this.value)"
              class="w-16 bg-surface text-center font-bold text-ink py-1 rounded-xl border border-borderWarm outline-none focus:border-terracotta text-sm">
          </div>
          <div class="col-span-3 flex justify-center">
            <input type="number" value="${set.reps}" onchange="updateSetVal('${ex.id}', ${idx}, 'reps', this.value)"
              class="w-12 bg-surface text-center font-bold text-ink py-1 rounded-xl border border-borderWarm outline-none focus:border-terracotta text-sm">
          </div>
          <div class="col-span-2 flex justify-end">
            <button onclick="toggleSetDone('${ex.id}', ${idx})" class="tactile-btn w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
              isDone
                ? 'bg-sage border-sage text-white font-bold shadow-sm'
                : 'bg-surface border-borderWarm text-transparent shadow-tile'
            }">✓</button>
          </div>
        </div>
      `;
    });

    html += `
      </div>
      <div class="pt-1 flex justify-between items-center">
        <button onclick="appendExtraSet('${ex.id}')" class="text-[11px] font-semibold text-terracotta hover:underline active:opacity-75">+ Add Autoregulated Set</button>
      </div>
    `;
    card.innerHTML = html;
    list.appendChild(card);
  });

  calculateVolumeProgress();
}

function updateSetVal(exId, idx, field, val) {
  if (prog().logs[exId] && prog().logs[exId][idx]) {
    prog().logs[exId][idx][field] = parseFloat(val) || 0;
    persistState();
    calculateVolumeProgress();
  }
}

function toggleSetDone(exId, idx) {
  if (prog().logs[exId] && prog().logs[exId][idx]) {
    const current = !prog().logs[exId][idx].done;
    prog().logs[exId][idx].done = current;
    persistState();
    if (current) {
      playSetCompletedSound();
      if (prog().autoRest) triggerRestTimer();
    } else {
      playChime(329.63, 0.15);
    }
    renderCurrentWorkout();
  }
}

function appendExtraSet(exId) {
  playChime(523.25, 0.1);
  if (prog().logs[exId]) {
    const last = prog().logs[exId][prog().logs[exId].length - 1] || { weight: '', reps: 12 };
    prog().logs[exId].push({ weight: last.weight, reps: last.reps, done: false });
    persistState();
    renderCurrentWorkout();
  }
}

function toggleCue(exId) {
  const el = document.getElementById(`cue-${exId}`);
  if (el) el.classList.toggle('hidden');
}

const SessionClock = { key: "", phases: [], running: false, startedAt: 0, elapsedOffset: 0, intervalId: null, lastIndex: 0, announcedDone: false };
function stopSessionTicker() {
  if (SessionClock.intervalId) clearInterval(SessionClock.intervalId);
  SessionClock.intervalId = null;
}
function sessionElapsed() {
  if (!SessionClock.running) return SessionClock.elapsedOffset;
  return SessionClock.elapsedOffset + (Date.now() - SessionClock.startedAt) / 1000;
}
function sessionPosition() {
  const phases = SessionClock.phases || [];
  const elapsed = sessionElapsed();
  if (!phases.length) return { index: 0, remaining: 0, done: false, elapsed: 0, total: 0 };
  let cursor = 0;
  const total = phases.reduce((sum, phase) => sum + phase.seconds, 0);
  for (let i = 0; i < phases.length; i++) {
    const end = cursor + phases[i].seconds;
    if (elapsed < end - 0.05) return { index: i, remaining: Math.max(0, Math.ceil(end - elapsed)), done: false, elapsed: elapsed, total: total };
    cursor = end;
  }
  return { index: phases.length - 1, remaining: 0, done: true, elapsed: total, total: total };
}
function bindSession(dayData) {
  const key = AppState.programId + ":" + dayData.day;
  if (SessionClock.key === key) return;
  stopSessionTicker();
  SessionClock.key = key;
  SessionClock.phases = dayData.phases || [];
  SessionClock.running = false;
  SessionClock.startedAt = 0;
  SessionClock.elapsedOffset = 0;
  SessionClock.lastIndex = 0;
  SessionClock.announcedDone = false;
}
function resetSessionClock(silent) {
  stopSessionTicker();
  SessionClock.running = false;
  SessionClock.startedAt = 0;
  SessionClock.elapsedOffset = 0;
  SessionClock.lastIndex = 0;
  SessionClock.announcedDone = false;
  if (!silent) syncSessionDisplay();
}
function startOrPauseSession() {
  const pos = sessionPosition();
  if (pos.done) {
    SessionClock.elapsedOffset = 0;
    SessionClock.announcedDone = false;
    SessionClock.lastIndex = 0;
  }
  if (SessionClock.running) {
    SessionClock.elapsedOffset = sessionElapsed();
    SessionClock.running = false;
    stopSessionTicker();
    playChime(329.63, 0.12);
  } else {
    if (AppState.timer.isRunning) pauseRest();
    SessionClock.startedAt = Date.now();
    SessionClock.running = true;
    stopSessionTicker();
    SessionClock.intervalId = setInterval(syncSessionDisplay, 200);
    playChime(523.25, 0.12);
  }
  syncSessionDisplay();
}
function syncSessionDisplay() {
  const pos = sessionPosition();
  const phase = SessionClock.phases[pos.index];
  const clock = document.getElementById('interval-clock');
  if (phase && pos.index !== SessionClock.lastIndex) {
    const previous = SessionClock.lastIndex;
    SessionClock.lastIndex = pos.index;
    if (SessionClock.running && previous !== pos.index && !document.hidden) playChime(phase.type === 'rest' ? 392 : 659.25, 0.16);
  }
  if (pos.done && SessionClock.running) {
    SessionClock.elapsedOffset = pos.total;
    SessionClock.running = false;
    stopSessionTicker();
    if (!SessionClock.announcedDone) {
      SessionClock.announcedDone = true;
      prog().protocols.finished = true;
      persistState();
      playChime(880, 0.45);
      updateProtocolsUI();
    }
  }
  if (!clock || !phase) {
    paintIntervalSummary(pos);
    return;
  }
  clock.textContent = formatClock(pos.remaining);
  clock.className = 'text-6xl font-light font-mono tracking-tight py-1 ' + (phase.type === 'rest' ? 'text-sage' : 'text-ink');
  const phaseLabel = document.getElementById('interval-phase');
  const count = document.getElementById('interval-count');
  const name = document.getElementById('interval-name');
  const detail = document.getElementById('interval-detail');
  const cue = document.getElementById('interval-cue');
  const next = document.getElementById('interval-next');
  const toggle = document.getElementById('interval-toggle');
  if (phaseLabel) {
    phaseLabel.textContent = phase.type === 'rest' ? 'Rest' : (AppState.programId === 'emom' ? 'Minute' : 'Work');
    phaseLabel.className = 'text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ' + (phase.type === 'rest' ? 'text-sage bg-sageSoft' : 'text-terracotta bg-terracottaSoft');
  }
  if (count) count.textContent = AppState.programId === 'emom' ? ('Minute ' + phase.round + ' of ' + phase.rounds) : ((phase.type === 'rest' ? 'After round ' : 'Round ') + phase.round + ' of ' + phase.rounds);
  if (name) name.textContent = phase.name;
  if (detail) detail.textContent = phase.detail;
  if (cue) cue.textContent = phase.cue;
  if (next) {
    const upcoming = SessionClock.phases[pos.index + 1];
    next.textContent = pos.done ? 'Session complete.' : (upcoming ? 'Next: ' + upcoming.name + ' · ' + formatClock(upcoming.seconds) : 'Last piece.');
  }
  if (toggle) toggle.textContent = SessionClock.running ? 'Pause' : (pos.done ? 'Run again' : (sessionElapsed() > 0 ? 'Resume' : 'Start'));
  const donePhases = pos.done ? SessionClock.phases.length : pos.index;
  const total = SessionClock.phases.length;
  document.getElementById('session-progress-counts').textContent = donePhases + ' / ' + total;
  document.getElementById('session-progress-bar').style.width = (total ? (donePhases / total) * 100 : 0) + '%';
  paintIntervalSummary(pos);
}
function paintIntervalSummary(pos) {
  const setsLabel = document.getElementById('stat-sets-label');
  const setsUnit = document.getElementById('stat-sets-unit');
  const tonnageLabel = document.getElementById('stat-tonnage-label');
  const tonnageUnit = document.getElementById('stat-tonnage-unit');
  if (!setsLabel || !SessionClock.phases.length) return;
  if (AppState.programId !== 'emom' && AppState.programId !== 'hiit') return;
  const donePhases = pos.done ? SessionClock.phases.length : pos.index;
  setsLabel.textContent = AppState.programId === 'emom' ? 'Minutes In' : 'Pieces In';
  document.getElementById('stat-sets-count').textContent = donePhases;
  if (setsUnit) setsUnit.textContent = 'of ' + SessionClock.phases.length;
  if (tonnageLabel) tonnageLabel.textContent = 'Session';
  document.getElementById('stat-tonnage-val').textContent = pos.done || (prog().protocols && prog().protocols.finished) ? 'Done' : (SessionClock.running ? 'Live' : 'Ready');
  if (tonnageUnit) tonnageUnit.textContent = formatClock(Math.round(pos.elapsed || 0)) + ' elapsed';
}
function renderIntervalWorkout(dayData) {
  bindSession(dayData);
  const list = document.getElementById('exercises-container');
  list.innerHTML = `
    <div class="bg-surface rounded-3xl border border-borderWarm p-5 shadow-cozy text-center space-y-3">
      <span id="interval-phase" class="text-[10px] font-bold uppercase tracking-wider text-terracotta bg-terracottaSoft px-3 py-1 rounded-full">Work</span>
      <div id="interval-clock" class="text-6xl font-light font-mono text-ink tracking-tight py-1">00:00</div>
      <div id="interval-count" class="text-[11px] font-semibold text-inkMuted"></div>
      <div>
        <h3 id="interval-name" class="text-base font-bold text-ink"></h3>
        <p id="interval-detail" class="text-xs text-inkMuted mt-0.5"></p>
      </div>
      <p id="interval-cue" class="text-xs text-inkMuted bg-surfaceWarm/80 p-2.5 rounded-2xl border border-borderSubtle leading-relaxed text-left"></p>
      <p id="interval-next" class="text-[11px] text-inkFaint"></p>
      <div class="flex items-center justify-center space-x-3 pt-1">
        <button id="interval-toggle" onclick="startOrPauseSession()" class="tactile-btn w-32 py-2.5 bg-terracotta text-white text-xs font-bold rounded-2xl shadow-tile">Start</button>
        <button onclick="resetSessionClock(false)" class="tactile-btn w-24 py-2.5 bg-surfaceWarm text-inkMuted text-xs font-semibold rounded-2xl border border-borderWarm shadow-tile">Reset</button>
      </div>
    </div>`;
  syncSessionDisplay();
}
function toggleIntervalFlag(key) {
  const ids = { insideMinute: 'emom-inside', scaled: 'emom-scaled', hard: 'hiit-hard', easyRest: 'hiit-easy', finished: AppState.programId === 'hiit' ? 'hiit-finished' : 'emom-finished' };
  prog().protocols[key] = document.getElementById(ids[key]).checked;
  playChime(prog().protocols[key] ? 659.25 : 329.63, 0.15);
  persistState();
  syncSessionDisplay();
}
function updateFlagProtocolsUI(map) {
  Object.keys(map).forEach((key) => {
    const el = document.getElementById(map[key]);
    if (el) el.checked = !!prog().protocols[key];
  });
}

function markAllCompletedToday() {
  const dayData = activeSplit().find(d => d.day === prog().currentDay);
  if (!dayData) return;
  if (isIntervalDay(dayData)) {
    prog().protocols.finished = true;
    persistState();
    playChime(783.99, 0.4);
    updateProtocolsUI();
    syncSessionDisplay();
    return;
  }
  dayData.exercises.forEach(ex => {
    if (prog().logs[ex.id]) prog().logs[ex.id].forEach(s => s.done = true);
  });
  persistState();
  playChime(783.99, 0.4);
  renderCurrentWorkout();
}

function calculateVolumeProgress() {
  const dayData = activeSplit().find(d => d.day === prog().currentDay);
  if (!dayData) return;
  let totalSets = 0, completedSets = 0, cumulativeTonnage = 0;
  dayData.exercises.forEach(ex => {
    if (prog().logs[ex.id]) {
      prog().logs[ex.id].forEach(s => {
        totalSets++;
        if (s.done) {
          completedSets++;
          cumulativeTonnage += ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0));
        }
      });
    }
  });
  document.getElementById('session-progress-counts').textContent = `${completedSets} / ${totalSets}`;
  const pct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  document.getElementById('session-progress-bar').style.width = `${pct}%`;
  document.getElementById('stat-sets-count').textContent = completedSets;
  document.getElementById('stat-tonnage-val').textContent = cumulativeTonnage.toLocaleString();
  const setsLabel = document.getElementById('stat-sets-label');
  const setsUnit = document.getElementById('stat-sets-unit');
  const tonnageLabel = document.getElementById('stat-tonnage-label');
  const tonnageUnit = document.getElementById('stat-tonnage-unit');
  if (setsLabel) setsLabel.textContent = 'Sets Logged';
  if (setsUnit) setsUnit.textContent = 'completed today';
  if (tonnageLabel) tonnageLabel.textContent = 'Tonnage Moved';
  if (tonnageUnit) tonnageUnit.textContent = 'cumulative pounds';
}

function switchTab(tabId) {
  AppState.activeTab = tabId;
  ['workout', 'protocols', 'timer', 'summary'].forEach(t => {
    const page = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-btn-${t}`);
    if (t === tabId) {
      page.classList.remove('hidden');
      nav.classList.add('text-terracotta');
      nav.classList.remove('text-inkFaint');
    } else {
      page.classList.add('hidden');
      nav.classList.remove('text-terracotta');
      nav.classList.add('text-inkFaint');
    }
  });
  const scroller = document.getElementById('lg-content');
  if (scroller) scroller.scrollTo({ top: 0, behavior: 'instant' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}

function formatClock(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function setRestDuration(s) {
  playChime(587.33, 0.1);
  AppState.timer.duration = s;
  AppState.timer.pausedRemaining = s;
  if (AppState.timer.isRunning) AppState.timer.targetTimestamp = Date.now() + (s * 1000);
  persistState();
  syncTimerDisplays();
}

function adjustRest(s) {
  const currentRem = getRemainingRestSeconds();
  const newRem = Math.max(0, currentRem + s);
  AppState.timer.duration = Math.max(AppState.timer.duration, newRem);
  if (AppState.timer.isRunning) AppState.timer.targetTimestamp = Date.now() + (newRem * 1000);
  else AppState.timer.pausedRemaining = newRem;
  syncTimerDisplays();
}

function getRemainingRestSeconds() {
  if (!AppState.timer.isRunning || !AppState.timer.targetTimestamp) return AppState.timer.pausedRemaining;
  return Math.max(0, Math.ceil((AppState.timer.targetTimestamp - Date.now()) / 1000));
}

function syncTimerDisplays() {
  const rem = getRemainingRestSeconds();
  const formatted = formatClock(rem);
  document.getElementById('timer-large-display').textContent = formatted;
  document.getElementById('pill-timer-text').textContent = formatted;
}

function showRestPill() {
  const pill = document.getElementById('floating-rest-pill');
  pill.classList.remove('-translate-y-20', 'opacity-0', 'pointer-events-none');
  pill.classList.add('translate-y-0', 'opacity-100');
}

function dismissRestPill() {
  const pill = document.getElementById('floating-rest-pill');
  pill.classList.add('-translate-y-20', 'opacity-0', 'pointer-events-none');
  pill.classList.remove('translate-y-0', 'opacity-100');
}

function toggleRest() {
  if (AppState.timer.isRunning) pauseRest();
  else triggerRestTimer();
}

function triggerRestTimer() {
  if (AppState.timer.intervalId) clearInterval(AppState.timer.intervalId);
  const rem = AppState.timer.pausedRemaining > 0 ? AppState.timer.pausedRemaining : AppState.timer.duration;
  AppState.timer.targetTimestamp = Date.now() + (rem * 1000);
  AppState.timer.isRunning = true;
  document.getElementById('timer-toggle-btn').textContent = "Pause Rest";
  showRestPill();
  AppState.timer.intervalId = setInterval(() => {
    const remaining = getRemainingRestSeconds();
    syncTimerDisplays();
    if (remaining <= 3 && remaining > 0) playChime(440, 0.08);
    if (remaining <= 0) {
      clearInterval(AppState.timer.intervalId);
      AppState.timer.isRunning = false;
      AppState.timer.pausedRemaining = AppState.timer.duration;
      AppState.timer.targetTimestamp = null;
      syncTimerDisplays();
      playChime(880, 0.4);
      document.getElementById('timer-toggle-btn').textContent = "Start Rest";
      setTimeout(dismissRestPill, 2500);
    }
  }, 200);
}

function pauseRest() {
  if (AppState.timer.intervalId) clearInterval(AppState.timer.intervalId);
  AppState.timer.pausedRemaining = getRemainingRestSeconds();
  AppState.timer.isRunning = false;
  AppState.timer.targetTimestamp = null;
  document.getElementById('timer-toggle-btn').textContent = "Resume";
}

function resetRest() {
  if (AppState.timer.intervalId) clearInterval(AppState.timer.intervalId);
  AppState.timer.isRunning = false;
  AppState.timer.pausedRemaining = AppState.timer.duration;
  AppState.timer.targetTimestamp = null;
  syncTimerDisplays();
  document.getElementById('timer-toggle-btn').textContent = "Start Rest";
  dismissRestPill();
}

function toggleVacuum(setNum) {
  const key = `vac${setNum}`;
  prog().protocols[key] = !prog().protocols[key];
  playChime(prog().protocols[key] ? 659.25 : 392.00, 0.15);
  persistState();
  updateProtocolsUI();
}

function openVacuumModal() { document.getElementById('vacuum-modal').classList.remove('hidden'); }
function closeVacuumModal() {
  if (AppState.vacuum.intervalId) clearInterval(AppState.vacuum.intervalId);
  AppState.vacuum.isRunning = false;
  AppState.vacuum.targetTimestamp = null;
  document.getElementById('vacuum-modal').classList.add('hidden');
}

function getRemainingVacuumSeconds() {
  if (!AppState.vacuum.isRunning || !AppState.vacuum.targetTimestamp) return AppState.vacuum.duration;
  return Math.max(0, Math.ceil((AppState.vacuum.targetTimestamp - Date.now()) / 1000));
}

function startVacuumSession() {
  if (AppState.vacuum.isRunning) return;
  AppState.vacuum.isRunning = true;
  const total = AppState.vacuum.duration;
  AppState.vacuum.targetTimestamp = Date.now() + (total * 1000);
  const circ = 427;
  const circle = document.getElementById('vac-ring');
  const label = document.getElementById('vac-status-text');
  const counter = document.getElementById('vac-sec-display');
  const actionBtn = document.getElementById('vac-action-btn');
  label.textContent = "VACUUM ENGAGED";
  label.className = "text-[10px] uppercase font-bold text-terracotta tracking-widest mt-0.5";
  actionBtn.textContent = "Holding...";
  actionBtn.classList.add('opacity-75');
  playChime(523.25, 0.2);
  AppState.vacuum.intervalId = setInterval(() => {
    const count = getRemainingVacuumSeconds();
    counter.textContent = count;
    circle.style.strokeDashoffset = circ - (count / total) * circ;
    if (count <= 0) {
      clearInterval(AppState.vacuum.intervalId);
      AppState.vacuum.isRunning = false;
      AppState.vacuum.targetTimestamp = null;
      playChime(783.99, 0.35);
      label.textContent = "COMPLETE";
      label.className = "text-[10px] uppercase font-bold text-sage tracking-widest mt-0.5";
      actionBtn.textContent = "Hold Again (15s)";
      actionBtn.classList.remove('opacity-75');
      if (!prog().protocols.vac1) prog().protocols.vac1 = true;
      else if (!prog().protocols.vac2) prog().protocols.vac2 = true;
      else if (!prog().protocols.vac3) prog().protocols.vac3 = true;
      persistState();
      updateProtocolsUI();
    }
  }, 150);
}

function openWeightModal() {
  document.getElementById('input-weight').value = AppState.weight.toFixed(1);
  document.getElementById('weight-modal').classList.remove('hidden');
}
function closeWeightModal() { document.getElementById('weight-modal').classList.add('hidden'); }
function saveWeight() {
  const val = parseFloat(document.getElementById('input-weight').value);
  if (!isNaN(val) && val > 0) {
    AppState.weight = val;
    document.getElementById('header-weight-val').textContent = val.toFixed(1);
    persistState();
    playChime(659.25, 0.2);
  }
  closeWeightModal();
}

function renderMealsGrid() {
  const grid = document.getElementById('meals-tile-grid');
  grid.innerHTML = '';
  prog().protocols.meals.forEach((done, index) => {
    const btn = document.createElement('button');
    btn.className = `tactile-btn py-2 text-xs font-semibold rounded-2xl border transition-all ${
      done
        ? 'bg-butter text-ink border-butter shadow-sm'
        : 'bg-surfaceWarm text-inkMuted border-borderWarm shadow-tile hover:text-ink'
    }`;
    btn.innerHTML = `<span class="block text-[9px] uppercase font-bold text-inkFaint">M</span>${index + 1}`;
    btn.onclick = () => toggleMeal(index);
    grid.appendChild(btn);
  });
  updateProtocolsUI();
}

function toggleMeal(idx) {
  prog().protocols.meals[idx] = !prog().protocols.meals[idx];
  playChime(prog().protocols.meals[idx] ? 587.33 : 329.63, 0.12);
  persistState();
  renderMealsGrid();
}

function toggleProtocol(key) {
  if (key === 'liss') prog().protocols.liss = document.getElementById('protocol-liss').checked;
  else if (key === 'feeder') prog().protocols.feeder = document.getElementById('protocol-feeder').checked;
  else if (key === 'nocturnal') prog().protocols.nocturnal = document.getElementById('protocol-nocturnal').checked;
  playChime(prog().protocols[key] ? 659.25 : 329.63, 0.15);
  persistState();
  updateProtocolsUI();
}

function setFeederType(type, silent) {
  if (AppState.programId !== 'bbtd') return;
  if (!silent) playChime(493.88, 0.1);
  prog().protocols.feederType = type;
  persistState();
  ['arms', 'delts', 'calves'].forEach(t => {
    const btn = document.getElementById(`fdr-${t}`);
    btn.className = t === type ? 'py-1.5 rounded-xl bg-surface text-ink shadow-sm' : 'py-1.5 rounded-xl text-inkMuted';
  });
  const descMap = {
    arms: "50 Standing DB Hammer Curls directly into 50 Lying DB Extensions. Smooth rhythm, continuous tension, no resting.",
    delts: "100 Standing DB Side Lateral Raises using light 10–15 lb weights. Keep leading with elbows and burning through.",
    calves: "100 Unbroken full-stretch calf plantarflexions (standing bodyweight or light machine bounce) before bed."
  };
  document.getElementById('feeder-desc-text').textContent = descMap[type] || descMap.arms;
}

function toggleSulekFlag(key) {
  const ids = { liss: 'sulek-liss', failure: 'sulek-failure', partials: 'sulek-partials', dropset: 'sulek-dropset', restDay: 'sulek-rest' };
  prog().protocols[key] = document.getElementById(ids[key]).checked;
  playChime(prog().protocols[key] ? 659.25 : 329.63, 0.15);
  persistState();
}
function renderSulekFeedings() {
  const grid = document.getElementById('sulek-feedings-grid');
  grid.innerHTML = '';
  SULEK_FEEDINGS.forEach((label, index) => {
    const done = !!prog().protocols.feedings[index];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tactile-btn w-full py-2 px-3 text-xs font-semibold rounded-2xl border text-left ' + (done ? 'bg-butter text-ink border-butter shadow-sm' : 'bg-surfaceWarm text-inkMuted border-borderWarm shadow-tile');
    btn.textContent = done ? label + ' ✓' : label;
    btn.onclick = () => { prog().protocols.feedings[index] = !prog().protocols.feedings[index]; playChime(prog().protocols.feedings[index] ? 587.33 : 329.63, 0.12); persistState(); renderSulekFeedings(); };
    grid.appendChild(btn);
  });
  document.getElementById('sulek-feedings-count').textContent = prog().protocols.feedings.filter(Boolean).length + ' of ' + SULEK_FEEDINGS.length;
}
function updateSulekProtocolsUI() {
  document.getElementById('sulek-liss').checked = !!prog().protocols.liss;
  document.getElementById('sulek-failure').checked = !!prog().protocols.failure;
  document.getElementById('sulek-partials').checked = !!prog().protocols.partials;
  document.getElementById('sulek-dropset').checked = !!prog().protocols.dropset;
  document.getElementById('sulek-rest').checked = !!prog().protocols.restDay;
  document.getElementById('sulek-feedings-count').textContent = (prog().protocols.feedings || []).filter(Boolean).length + ' of ' + SULEK_FEEDINGS.length;
}
function toggleCutlerFlag(key) {
  const ids = { cardio: 'cutler-cardio', shortRest: 'cutler-short-rest', pump: 'cutler-pump', fst7: 'cutler-fst7' };
  prog().protocols[key] = document.getElementById(ids[key]).checked;
  playChime(prog().protocols[key] ? 659.25 : 329.63, 0.15);
  persistState();
}
function renderCutlerFeedings() {
  const grid = document.getElementById('cutler-feedings-grid');
  grid.innerHTML = '';
  CUTLER_FEEDINGS.forEach((label, index) => {
    const done = !!prog().protocols.feedings[index];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tactile-btn w-full py-2 px-2 text-xs font-semibold rounded-2xl border text-center ' + (done ? 'bg-butter text-ink border-butter shadow-sm' : 'bg-surfaceWarm text-inkMuted border-borderWarm shadow-tile');
    btn.textContent = done ? label + ' ✓' : label;
    btn.onclick = () => { prog().protocols.feedings[index] = !prog().protocols.feedings[index]; playChime(prog().protocols.feedings[index] ? 587.33 : 329.63, 0.12); persistState(); renderCutlerFeedings(); };
    grid.appendChild(btn);
  });
  document.getElementById('cutler-feedings-count').textContent = prog().protocols.feedings.filter(Boolean).length + ' of ' + CUTLER_FEEDINGS.length;
}
function updateCutlerProtocolsUI() {
  document.getElementById('cutler-cardio').checked = !!prog().protocols.cardio;
  document.getElementById('cutler-short-rest').checked = !!prog().protocols.shortRest;
  document.getElementById('cutler-pump').checked = !!prog().protocols.pump;
  document.getElementById('cutler-fst7').checked = !!prog().protocols.fst7;
  document.getElementById('cutler-feedings-count').textContent = (prog().protocols.feedings || []).filter(Boolean).length + ' of ' + CUTLER_FEEDINGS.length;
}
function updateProtocolsUI() {
  if (AppState.programId === 'sulek') { updateSulekProtocolsUI(); return; }
  if (AppState.programId === 'cutler') { updateCutlerProtocolsUI(); return; }
  if (AppState.programId === 'emom') { updateFlagProtocolsUI({ insideMinute: 'emom-inside', scaled: 'emom-scaled', finished: 'emom-finished' }); return; }
  if (AppState.programId === 'hiit') { updateFlagProtocolsUI({ hard: 'hiit-hard', easyRest: 'hiit-easy', finished: 'hiit-finished' }); return; }
  [1, 2, 3].forEach(n => {
    const btn = document.getElementById(`vac-btn-${n}`);
    if (prog().protocols[`vac${n}`]) {
      btn.className = 'tactile-btn py-2 text-xs font-semibold rounded-2xl bg-sage border border-sage text-white shadow-sm';
      btn.textContent = `Hold ${n} ✓`;
    } else {
      btn.className = 'tactile-btn py-2 text-xs font-medium rounded-2xl bg-surfaceWarm border border-borderWarm text-inkMuted shadow-tile';
      btn.textContent = `Hold ${n}`;
    }
  });
  document.getElementById('protocol-liss').checked = prog().protocols.liss;
  document.getElementById('protocol-feeder').checked = prog().protocols.feeder;
  document.getElementById('protocol-nocturnal').checked = prog().protocols.nocturnal;
  const doneMeals = prog().protocols.meals.filter(Boolean).length;
  document.getElementById('meals-logged-count').textContent = `${doneMeals} of ${prog().protocols.meals.length}`;
}

function copyDailyNotes() {
  const dayData = activeSplit().find(d => d.day === prog().currentDay) || activeSplit()[0];
    const meta = PROGRAM_META[AppState.programId];
  let notes = `${meta.title.toUpperCase()} • Day ${dayData.day}: ${dayData.title}\n`;
  notes += `Current Weight: ${AppState.weight} lbs\n\n`;
  if (isIntervalDay(dayData)) {
    const pos = sessionPosition();
    notes += `SESSION:\n• ${dayData.title}\n• Clock: ${pos.done ? 'Finished' : 'Not finished'}\n`;
  } else {
  notes += `EXERCISES LOGGED:\n`;
  dayData.exercises.forEach(ex => {
    const sets = prog().logs[ex.id] || [];
    const completedSets = sets.filter(s => s.done);
    if (completedSets.length > 0) {
      notes += `• ${ex.name}: ${completedSets.length}/${sets.length} sets completed\n`;
      completedSets.forEach((s, i) => { notes += `   Set ${i + 1}: ${s.weight || 0} lbs × ${s.reps} reps\n`; });
    }
  });
  }
  notes += `\nDAILY CHECKLIST:\n`;
  if (AppState.programId === 'sulek') {
    notes += `• Morning LISS bike: ${prog().protocols.liss ? 'Completed' : 'Pending'}\n`;
    notes += `• Sets to failure: ${prog().protocols.failure ? 'Yes' : 'No'}\n`;
    notes += `• Lengthened partials: ${prog().protocols.partials ? 'Yes' : 'No'}\n`;
    notes += `• Drop set: ${prog().protocols.dropset ? 'Yes' : 'No'}\n`;
    notes += `• Rest day: ${prog().protocols.restDay ? 'Taken' : 'Training'}\n`;
    notes += `• Feedings: ${prog().protocols.feedings.filter(Boolean).length}/5\n`;
  } else if (AppState.programId === 'cutler') {
    notes += `• Morning cardio: ${prog().protocols.cardio ? 'Completed' : 'Pending'}\n`;
    notes += `• Rests near 60s: ${prog().protocols.shortRest ? 'Yes' : 'No'}\n`;
    notes += `• Pump, not a max: ${prog().protocols.pump ? 'Yes' : 'No'}\n`;
    notes += `• FST-7 finisher: ${prog().protocols.fst7 ? 'Done' : 'Not logged'}\n`;
    notes += `• Feedings: ${prog().protocols.feedings.filter(Boolean).length}/6\n`;
  } else if (AppState.programId === 'emom') {
    notes += `• Finished inside each minute: ${prog().protocols.insideMinute ? 'Yes' : 'No'}\n`;
    notes += `• Rest left in the minute: ${prog().protocols.scaled ? 'Yes' : 'No'}\n`;
    notes += `• Session: ${prog().protocols.finished ? 'Finished' : 'Open'}\n`;
  } else if (AppState.programId === 'hiit') {
    notes += `• Work intervals were hard: ${prog().protocols.hard ? 'Yes' : 'No'}\n`;
    notes += `• Recovery stayed easy: ${prog().protocols.easyRest ? 'Yes' : 'No'}\n`;
    notes += `• Session: ${prog().protocols.finished ? 'Finished' : 'Open'}\n`;
  } else {
    notes += `• Morning Vacuums: ${[prog().protocols.vac1, prog().protocols.vac2, prog().protocols.vac3].filter(Boolean).length}/3 holds\n`;
    notes += `• LISS Recumbent Bike: ${prog().protocols.liss ? 'Completed' : 'Pending'}\n`;
    notes += `• Nightly Feeder (${prog().protocols.feederType}): ${prog().protocols.feeder ? 'Completed' : 'Pending'}\n`;
    notes += `• Meals Logged: ${prog().protocols.meals.filter(Boolean).length}/8\n`;
    notes += `• Nocturnal Feed: ${prog().protocols.nocturnal ? 'Logged' : 'Pending'}\n`;
  }

  const tempArea = document.createElement('textarea');
  tempArea.value = notes;
  document.body.appendChild(tempArea);
  tempArea.select();
  try {
    document.execCommand('copy');
    playChime(659.25, 0.3);
    const btnLabel = document.getElementById('copy-btn-label');
    btnLabel.textContent = "Copied to Clipboard! ✓";
    setTimeout(() => { btnLabel.textContent = "Copy Today's Log to Clipboard"; }, 2200);
  } catch (err) {
    console.error('Clipboard copy failed', err);
  }
  document.body.removeChild(tempArea);
}

function resetDaySets() {
  const dayData = activeSplit().find(d => d.day === prog().currentDay);
  if (!dayData) return;
  if (isIntervalDay(dayData)) {
    resetSessionClock(false);
    prog().protocols.finished = false;
    persistState();
    playChime(329.63, 0.2);
    updateProtocolsUI();
    renderCurrentWorkout();
    return;
  }
  dayData.exercises.forEach(ex => {
    if (prog().logs[ex.id]) prog().logs[ex.id].forEach(s => { s.done = false; });
  });
  persistState();
  playChime(329.63, 0.2);
  renderCurrentWorkout();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    syncTimerDisplays();
    syncSessionDisplay();
    if (AppState.timer.isRunning) {
      const rem = getRemainingRestSeconds();
      if (rem <= 0) {
        clearInterval(AppState.timer.intervalId);
        AppState.timer.isRunning = false;
        AppState.timer.pausedRemaining = AppState.timer.duration;
        AppState.timer.targetTimestamp = null;
        syncTimerDisplays();
        playChime(880, 0.4);
        document.getElementById('timer-toggle-btn').textContent = "Start Rest";
        setTimeout(dismissRestPill, 2000);
      }
    }
  }
});
