// "알림만" — no character: short, plain notices only. Kinds that aren't here stay silent (no small talk).
// {task}, {count}, {left}, {date}, {level}, {name}, {title} are filled in.
(function (root) {
  const KO = {
    firstOfDay: ['오늘 할 일을 적어 두세요.', '새 하루예요. 오늘 할 일부터 정리해요.'],
    morning: ['좋은 아침이에요. 첫 할 일을 골라 보세요.'],
    back: ['다시 왔어요. 남은 할 일 {left}개.', '이어서 할 일: {task}'],
    nudge: ['다음 할 일: {task}', '{task} — 5분만 해 볼까요?', '{task}부터 시작해요.'],
    nudgeEmpty: ['적어 둔 할 일을 다 끝냈어요.', '남은 할 일이 없어요.'],
    lunch: ['점심 시간이에요.'], snack: ['간식 시간이에요. 잠깐 쉬어요.'], dinner: ['저녁 시간이에요.'],
    evening: ['오늘 남은 할 일을 확인해 보세요.'],
    wrapUp: ['마무리 시간이에요. 오늘 {count}개 끝냈어요.'], wrapUpZero: ['마무리 시간이에요. 내일로 넘길 건 > 로 옮겨 두세요.'],
    night: ['늦었어요. 이제 쉬어요.'],
    praise: ['완료. 남은 할 일 {left}개.', '하나 끝. 남은 건 {left}개예요.'],
    praiseAll: ['오늘 할 일을 모두 끝냈어요.'],
    migrate: ['내일로 옮겼어요.'], schedule: ['{date}로 옮겼어요.'],
    memo: ['적어 뒀어요.'],
    switchIn: ['알림만 보여 드릴게요.'],
    poke: ['다음 할 일: {task}', '남은 할 일 {left}개.'],
    study: ['공부 모드예요.'],
    focusStart: ['집중 시작.'], focusDone: ['집중 끝. 잠깐 쉬어요.'], focusStop: ['집중을 멈췄어요.'], focusKeep: ['계속 집중 중이에요.'], snooze: ['잠시 조용히 있을게요.'],
    batteryLow: ['배터리 {level}%. 충전하세요.'], batteryVeryLow: ['배터리 {level}%. 곧 꺼져요. 충전하세요.'], batteryFull: ['배터리가 다 찼어요.'],
    btLow: ['{name} 배터리 {level}%.'],
    renderDone: ['렌더가 끝났어요.'], strainCpu: ['CPU 사용량이 높아요.'], strainRam: ['메모리가 부족해요. 안 쓰는 창을 닫아 보세요.']
  };
  const EN = {
    firstOfDay: ["Write down today's tasks.", "New day. Start with today's list."],
    morning: ['Good morning. Pick a first task.'],
    back: ['Welcome back. {left} tasks left.', 'Next up: {task}'],
    nudge: ['Next: {task}', '{task} — try 5 minutes?', 'Start with {task}.'],
    nudgeEmpty: ['Everything on the list is done.', 'No tasks left.'],
    lunch: ['Lunch time.'], snack: ['Snack break.'], dinner: ['Dinner time.'],
    evening: ["Check what's left for today."],
    wrapUp: ['Wrap-up time. {count} done today.'], wrapUpZero: ['Wrap-up time. Move what waits to tomorrow with >.'],
    night: ["It's late. Time to rest."],
    praise: ['Done. {left} left.', 'One down, {left} to go.'],
    praiseAll: ["All of today's tasks are done."],
    migrate: ['Moved to tomorrow.'], schedule: ['Moved to {date}.'],
    memo: ['Noted.'], switchIn: ["Notices only, from now on."], poke: ['Next: {task}', '{left} tasks left.'],
    study: ['Study mode.'], focusStart: ['Focus started.'], focusDone: ['Focus done. Take a short break.'], focusStop: ['Focus stopped.'], focusKeep: ['Still focusing.'], snooze: ["I'll stay quiet for a while."],
    batteryLow: ['Battery {level}%. Plug in.'], batteryVeryLow: ['Battery {level}%. Plug in now.'], batteryFull: ['Battery full.'],
    btLow: ['{name} battery {level}%.'], renderDone: ['Render finished.'], strainCpu: ['CPU is busy.'], strainRam: ['Memory is low. Close what you are not using.']
  };
  const JA = {
    firstOfDay: ['今日のタスクを書いておきましょう。', '新しい一日です。まず今日のタスクから。'],
    morning: ['おはようございます。最初のタスクを選びましょう。'],
    back: ['おかえりなさい。残り {left} 件。', '次のタスク: {task}'],
    nudge: ['次のタスク: {task}', '{task} — 5分だけやってみますか？', '{task}から始めましょう。'],
    nudgeEmpty: ['書いたタスクは全部終わりました。', '残りのタスクはありません。'],
    lunch: ['お昼の時間です。'], snack: ['おやつの時間です。少し休みましょう。'], dinner: ['夕食の時間です。'],
    evening: ['今日の残りのタスクを確認しましょう。'],
    wrapUp: ['締めの時間です。今日は {count} 件終わりました。'], wrapUpZero: ['締めの時間です。明日に回すものは > で移しましょう。'],
    night: ['遅い時間です。休みましょう。'],
    praise: ['完了。残り {left} 件。', 'ひとつ終わり。残り {left} 件です。'],
    praiseAll: ['今日のタスクは全部終わりました。'],
    migrate: ['明日に移しました。'], schedule: ['{date} に移しました。'],
    memo: ['書いておきました。'], switchIn: ['お知らせだけ表示します。'], poke: ['次のタスク: {task}', '残り {left} 件。'],
    study: ['勉強モードです。'], focusStart: ['集中スタート。'], focusDone: ['集中終わり。少し休みましょう。'], focusStop: ['集中を止めました。'], focusKeep: ['集中を続けています。'], snooze: ['しばらく静かにしています。'],
    batteryLow: ['バッテリー {level}%。充電してください。'], batteryVeryLow: ['バッテリー {level}%。もうすぐ切れます。'], batteryFull: ['バッテリー満タンです。'],
    btLow: ['{name} のバッテリー {level}%。'], renderDone: ['レンダリングが終わりました。'], strainCpu: ['CPU使用率が高いです。'], strainRam: ['メモリが足りません。使っていないウィンドウを閉じましょう。']
  };
  const B = (root.LineBanks = root.LineBanks || {});
  B['plain:ko'] = KO; B['plain:en'] = EN; B['plain:ja'] = JA;
  if (typeof module !== 'undefined' && module.exports) module.exports = { KO, EN, JA };
})(typeof window !== 'undefined' ? window : globalThis);
