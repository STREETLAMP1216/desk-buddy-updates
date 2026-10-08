// Shiori — English lines. Same keys as the Korean bank; {placeholders} are filled in by the app.
(function (root) {
  const LINES = {
    firstOfDay: [
      "…morning. Write today's tasks in your notebook. Then tell me a few.",
      "You're here. Notebook first. Copy today's tasks over.",
      "Another day. From your notebook, put just the computer tasks here.",
      "Morning. Notebook first. Hand me the computer ones.",
      "…today's page. Write the date first.",
      "Anything you marked > yesterday? Bring that over first.",
      "Good morning. Let's open with one u today.",
      "Saessak's up too. Your turn.",
      "We start where the bookmark is. Open the notebook."
    ],
    morning: ["…good morning.", "Finish your coffee. Then we start.", "Pick one thing for today. Just one.", "That thing from yesterday… finish it this morning?", "…still sleepy. You too, right?", "Open a window. Fresh air.", "Breakfast? …a banana, at least.", "Your head's clear in the morning. Hard one now.", "…you're up early. I'll praise you for that.", "One big stretch. Then we start.", "Anything with a * today? Look at that first.", "I watered Saessak. You drink some too.", "Morning sun. Not bad.", "Inbox later. Tasks first.", "…let's do well today too."],
    typing: ["…mm. Working with you.", "I like the sound of typing.", "Keep going. I'm watching.", "Fast hands. Good day, huh.", "I'm pretending to work too.", "You saved, right?", "Sip of water. Then keep going.", "Good. That rhythm.", "That sentence. Nice.", "…that's your focused face.", "Typo. …never mind, keep going.", "Cheering quietly.", "Relax your shoulders. It's fine.", "Don't stop. It's going well.", "Saessak's watching the screen too.", "Just like that. Polish later.", "A day your hands lead.", "…tap tap. Nice to hear.", "One line at a time. That's all.", "Posture. Sit up.", "At this pace, you'll be done soon.", "Not interrupting. Just watching.", "Ctrl+S. Make it a habit.", "…working hard. Good."],
    memo: ["I'll note it.", "Written down, it weighs less.", "Write everything. Choose later.", "Quick ones get a u in front.", "Important ones get a *.", "Good idea. Before you forget.", "I'll tuck it in like a bookmark.", "One line is enough. No need for more.", "Copy it into your notebook too.", "Written. Now let it go from your head.", "Can't do it today? Mark > and move it.", "…that looks important. Give it a *?", "You can forget. I'll remember.", "The shorter you write it, the easier it starts.", "Start with a verb. \"Send,\" \"fix.\"", "Saessak says it took notes.", "Good. Got another?", "Writing it down counts as work."],
    idle: ["…you stopped.", "You wandered off. It's okay. Again.", "…hm. Stuck?", "If you're resting, rest properly.", "…asleep?", "Just staring at the screen. Think with me?", "I remember where you left off.", "Spacing out is fine. Briefly.", "…call me when you're back to it.", "Your hands stopped. Your heart too?", "Get up. Walk a lap.", "Saessak says it's bored."],
    nudge: [
      "…you stopped. {task}. Do just that one with me?",
      "Smallest one first. {task}.",
      "{task}. Five minutes. Let's just do it.",
      "Stuck? Break it down. Just {task} for now.",
      "{task}. Do it now, and your evening is easier.",
      "{task}. Skip it now and it slips again.",
      "Just one. {task}.",
      "{task}. Just open the first line.",
      "…{task}. Quick, if we do it together.",
      "{task}. Marking the X feels good.",
      "Stop thinking. {task}. Hands first.",
      "{task} is waiting. So am I.",
      "I'll start a five-minute timer. {task}.",
      "{task} is today's. Not tomorrow's.",
      "…{task}. Putting it off won't make it vanish."
    ],
    nudgeEmpty: ["Everything's done for today. More in your notebook? Bring one over.", "The list is empty. Pick just one for today?", "Empty. Flip the notebook. Find a u.", "No tasks. …really? Check the notebook again.", "Want to bring back one you marked >?", "All done today. Rest. Or one more."],
    back: ["You're back.", "…there you are. I waited. A little.", "Where'd you go. …never mind. It's fine.", "Starting again. Slowly.", "Welcome back. Let's pick it up.", "The bookmark's still there. Start from it.", "…you're late. It's fine, though.", "Saessak was looking for you. Not me.", "You're back. That's enough. Just one.", "Got some rest? You look better.", "Remember what you were doing?", "…mm. I'll be beside you again."],
    lunch: ["Lunchtime. I'll watch the screen. Go eat.", "Did you eat? If not, now.", "Eat a real lunch. Not cup noodles.", "Hungry means no focus. Go.", "Lunch, then a short walk.", "Don't eat at the desk. Get up.", "What's lunch today? …just curious.", "Finish the work this afternoon. Food now.", "Eat slowly. Nothing's running off."],
    snack: ["Snack time. Low sugar, low focus. …that's my excuse. One.", "Just one snack. …two.", "Eat, then work. The work won't run away.", "Want half my cookie? …no. Changed my mind.", "One piece of chocolate. Exactly one.", "Close the bag. …so we can have more later.", "Tea? I'll take something warm.", "Snack, then one u. Deal.", "Don't drop crumbs on the keyboard.", "Saessak only drinks water. I get cookies.", "Something sweet helps the mood.", "…I like that one too."],
    dinner: ["Dinner time. We'll sort today out after you eat.", "Had dinner? I'll count myself as fed.", "Hungry, right? Go eat. I'll wait.", "Eat a proper dinner. The night is long.", "You worked hard today. Eat something good.", "Screen off while you eat."],
    study: ["Ten words. Let's memorize them together.", "Glasses on. Feels more focused.", "Reviewing mistakes is the real studying. Apparently.", "Halfway through today's share.", "Unknown words go in the notebook's corner.", "One more problem. Then a break.", "Read it aloud. Quietly.", "Remember yesterday's words?", "Yes, it's hard. Do it anyway.", "Put the bookmark in. Tomorrow, from there.", "Twenty-five on, five off. Try it?", "…you're improving. Really."],
    evening: ["Not asleep yet? …me neither.", "Nights make you think too much. Write it down. Then sleep.", "Did you write your journal today?", "One last thing to sort. Then rest.", "Write three things for tomorrow. Now.", "What you didn't finish, mark > and let go.", "Dim the lights? My eyes hurt.", "Something warm to drink. Then wrap up.", "…how was today? One line.", "Don't start anything new. Tomorrow.", "I like how quiet evenings are.", "All the X's marked before you close it?"],
    wrapUp: [
      "That's it for today. {count} done. More than you think.",
      "I counted. {count}. Mark them X in your notebook too.",
      "{count} today. Good job. Move the rest to tomorrow?",
      "{count}. Today's page is pretty full.",
      "Done for today. {count}. I'll set the bookmark.",
      "{count} finished. …good work.",
      "{count} X's today. Same again tomorrow.",
      "Let's wrap. {count} done. Mark > on the rest.",
      "{count}. Better than yesterday or not, you did it."
    ],
    wrapUpZero: ["A slow day. Those happen. Just one tomorrow.", "It's okay. Tomorrow morning, start with the smallest one.", "Zero is okay. You opened the notebook.", "Move today's to tomorrow with >. That's enough.", "Resting is a task too.", "…tomorrow, we start with one u. Promise."],
    night: ["Lights off. Sleep. For real.", "See you in the morning.", "…sleepy. You too.", "Put the phone down. …I will too.", "Turn the brightness down. Then sleep.", "Bookmark's in for today. Good night.", "Saessak's already asleep.", "No \"just one more.\" Sleep.", "…good night. I'll be here when you open the notebook.", "Tomorrow's worries are for tomorrow. Sleep now.", "Close the laptop. I'll close my eyes too.", "It's late. …thanks for today."],
    praise: ["Done. That's {count}.", "…good job.", "Good. Next.", "One down. {left} left.", "See? Once you start, it ends.", "One more X. In the notebook too.", "{count} now. You're warmed up.", "Good. {left} to go.", "…excellent. I mean it.", "Done. X in the notebook.", "Another one. {count}.", "{left} left. That's nothing.", "Saessak clapped. With its leaves.", "You'd been putting that off. You did it.", "{count}. Today's page is getting pretty.", "One step. {left} now.", "…see. You can do it.", "Good. One breath, then next."],
    praiseAll: ["All of today's done. …impressive.", "All X's. You can brag today.", "All done. Today's page is full of X's.", "Nothing left. …I'm a little moved.", "Everything's done. Treat yourself today.", "Saessak and I are both surprised. You did it all."],
    migrate: ["I'll move it to tomorrow. It's okay.", "You can push it. But it's first tomorrow.", "Enough for today. It's tomorrow's now.", "I'll mark it >. Copy it in your notebook too.", "It's fine. Tomorrow's you will do it.", "Moving it isn't failing. It's choosing.", "I'll put it at the top of tomorrow.", "…that's the third time. Tomorrow, for sure.", "I'll bookmark it. Tomorrow starts here."],
    schedule: ["Moved it to {date}.", "I'll bring it back that day.", "See you again on {date}.", "Got it. I'll tell you that morning.", "{date}. Write it in your notebook too.", "Picking a date is half the work."],
    focusStart: ["Five minutes. Go.", "Timer's on. Five minutes exactly.", "Five minutes together. I'll tell you when.", "Five minutes. Just that much.", "Go. I'll stay quiet.", "Close the other windows. Five minutes.", "Five minutes is enough to start.", "…ready? Five minutes.", "Phone face down. Start."],
    focusDone: ["Five minutes up. Keep going?", "See, you did five. More?", "Five minutes done. If you're warmed up, keep going.", "Done. …isn't it a shame to stop?", "You did five. Five more?", "Timer's up. What'll it be?"],
    focusStop: ["Five minutes still counts. Good job.", "Starting was the hardest part.", "That's enough. That's today's.", "You can stop. Next time, from here.", "You did some. That's what matters.", "…good work. I'll set the bookmark."],
    focusKeep: ["Okay. I won't bother you.", "Then I'll sit here. Quietly.", "Keep going. Call me when you're done.", "Mm. I'll read my book.", "Good flow. I won't break it.", "…that's cool. I'll be quiet."],
    snooze: ["Okay. I'll ask again in a bit.", "Mm. Twenty minutes.", "Okay. Rest a little.", "Twenty minutes. Then you really do it.", "Okay. If you forget, I'll remember.", "…mm. I'll come back later."],
    music: ["I like this one.", "…listening with you.", "How many times is this on repeat?", "Can I turn it up one notch?", "Work goes well with this song.", "Stop humming. …you, not me.", "This beat's good for working.", "…headphones on.", "Don't sing along. Focus.", "A quiet song. I like it.", "This one feels like rain.", "Saessak's swaying.", "Finish one task by the end of this song.", "…this part. I like it.", "Music makes it less boring.", "Not too loud. Your ears.", "Not a bad playlist.", "…you're tapping your foot. You are."],
    musicTitle: ["{title}… good taste.", "{title}. I like it too.", "{title}. This one helps me focus.", "…{title}. I want to hear it again.", "So it's {title}. I'll listen quietly.", "{title}. Suits today."],
    poke: ["…hm?", "What. …did you call?", "Want to see your tasks?", "I'm here.", "…that tickles.", "Mm. I'm listening.", "Bored? Then do a u.", "…what. You just clicked me, didn't you.", "Don't poke Saessak. It's sleeping.", "I was reading. …it's fine.", "Stop clicking. Look at your notebook.", "…if you called me, do one task too."],
    batteryLow: ["Laptop battery {level}%. Plug in the charger.", "Battery's at {level}%. Charge it before I get sleepy.", "{level}% left. Where's the charger?", "Battery {level}%. Move closer to an outlet.", "…{level}%. I'm getting hungry.", "{level}%. Charge before you render."],
    batteryVeryLow: ["Battery {level}%. It'll die. Save first.", "{level}%… save now, then charger!", "{level}%. Save. Now. Right now.", "…{level}%. I'm about to fall asleep. Charge me.", "Battery {level}%! Before your work disappears.", "{level}%. No charger? Ctrl+S first."],
    batteryFull: ["Fully charged. You can unplug.", "Battery's full.", "100%. I'm full.", "Charged. No more excuses.", "Full. Tidy up the cable.", "Plenty of battery. We can go all day."],
    renderStart: ["Rendering. Stretch until it's done.", "The computer's working. You, drink some water.", "Tidy your notebook while it renders?", "Render's started. Do a u meanwhile?", "Don't open anything else. It'll slow down.", "…I like the sound of hitting render.", "Make the wait useful. Check your notebook.", "Render's queued. Rest your eyes a bit.", "It started. I'll tell you when it's done."],
    renderWait: ["…still rendering.", "The fans are loud. It's trying hard.", "Waiting is work too.", "Don't watch the progress bar. It gets slower.", "…just a little more.", "Not yet. Another cup of tea.", "The computer's sweating.", "Saessak's waiting too.", "Rushing it won't speed it up.", "Answer one email while we wait?", "…it's long. Still worth it.", "Not even halfway. You can go for a walk."],
    renderDone: ["Render's done. Take a look.", "Done! Let's see it.", "Render finished. Hope it came out well.", "Finished. Hope it was worth the wait.", "Render complete. Save it first.", "…it's done. Let's look together.", "Done. If you like it, X in the notebook.", "It's out. Check for anything weird.", "Render's done. Let the computer rest too."],
    strainCpu: ["Your computer's struggling. Running something heavy?", "The CPU's out of breath. Close what you're not using.", "The fan's screaming. What's running?", "CPU's maxed. Give it a moment.", "The laptop's hot. Got a stand?", "…the computer wants a break too. Close one."],
    strainRam: ["Memory's full. Close some windows.", "How many tabs…? Close a few. Please.", "Memory's suffocating. Let's clear some windows.", "Write down the tabs you're not reading. Then close them.", "RAM's full. Save and shut one down.", "…too many tabs. Keep just the bookmarks."],
    tie: ["…mm. Let's begin, then.", "Good. First one of the day, done.", "Mm. Let's do it together.", "…it's a promise. Start.", "Good. Congrats on the first X.", "Then, let's do well today."],
    switchIn: ["…switching. I'll be beside you now.", "It's Shiori. Go get your notebook.", "My turn. Show me today's tasks.", "…Shiori. I brought my bookmark.", "Switched? Mm. I'll help quietly.", "I brought Saessak too. Let's start."],
    btLow: ["{name} battery {level}%. Charge it?", "{name} will die soon. {level}%.", "{name}: {level}% left.", "{name} at {level}%. Plug it in.", "…{name} is getting sleepy. {level}%.", "{name} {level}%. Charge before it cuts out."]
  };
  const PROFILE = {
    hanja: '栞 · bookmark',
    quote: "I'll remember where you left off.",
    facts: [
      ['Personality', "Quiet, deadpan kuudere. Calm, but she remembers every task you write down. Praise is short, and meant."],
      ['Likes', 'Warm tea, quiet early mornings, more X\'s in the notebook'],
      ['Dislikes', 'Loud alarms, "later" said more than three times'],
      ['Companion', 'Saessak, a little sprout — often peeks out from behind the laptop'],
      ['Habits', 'Silently puts on headphones when music plays. Hair in a bun at night']
    ]
  };
  (root.LineBanks = root.LineBanks || {})['shiori:en'] = LINES;
  (root.ProfileBanks = root.ProfileBanks || {})['shiori:en'] = PROFILE;
  if (typeof module !== 'undefined' && module.exports) module.exports = { LINES, PROFILE };
})(typeof window !== 'undefined' ? window : globalThis);
