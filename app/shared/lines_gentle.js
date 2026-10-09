// When earlier days left something unfinished: no scolding. Forgiving yourself for putting things off
// makes the next try more likely — so each character says it their way and points at one small thing.
(function (root) {
  const G = {
    'shiori:ko': ['어제 못 한 거, 괜찮아. 오늘 하나만 가져오자.', '남은 건 남은 거야. 탓하지 말고 하나만 고르자.', '…못 한 날도 있어. 오늘은 오늘 거.', '미룬 것도 기록이야. 다시 시작하면 돼.'],
    'shiori:en': ["Yesterday's leftovers are fine. Bring just one into today.", 'Some days go like that. Pick one and start again.'],
    'shiori:ja': ['昨日できなかったこと、大丈夫。今日はひとつだけ持ってこよう。', '…できない日もある。今日は今日のこと。'],
    'fubuki:ko': ['어제 로그에 미완료 몇 개. 버그 아니야, 다시 돌리면 돼.', '못 한 거 갖고 자책 금지. 하나만 오늘로 옮겨.', '실패 아니고 재시도 대기 중. 하나 골라.', '어제의 너는 어제 퇴근했어. 오늘 거 하자.'],
    'fubuki:en': ['A few unfinished in the log. Not a bug — just rerun one.', 'No self-blame allowed. Move one to today.'],
    'fubuki:ja': ['ログに未完了がいくつか。バグじゃない、もう一回走らせればいい。', '自分を責めるの禁止。ひとつだけ今日に移して。'],
    'suu:ko': ['어제 못 한 거? 괜찮아괜찮아! 오늘 하나만 같이 하자!', '남은 거 있어도 완전 정상이야. 하나만 골라 보자!', '자책은 노노~ 다시 시작하는 게 제일 멋있어!', '오늘이 새 출발이야. 제일 작은 거부터!'],
    'suu:en': ["Missed some yesterday? Totally fine! Let's do just one today!", 'Starting again is the coolest part. Pick the smallest one!'],
    'suu:ja': ['昨日の分？大丈夫大丈夫！今日はひとつだけ一緒にやろう！', 'やり直すのが一番かっこいいよ。一番小さいのから！'],
    'plain:ko': ['지난 날 남은 할 일이 있어요. 괜찮아요, 하나만 오늘로 가져와요.', '못 한 날도 있어요. 오늘 할 하나를 골라요.'],
    'plain:en': ['Some tasks are left from earlier. That is fine — bring one into today.'],
    'plain:ja': ['前の日の残りがあります。大丈夫、ひとつだけ今日に持ってきましょう。']
  };
  const B = (root.LineBanks = root.LineBanks || {});
  Object.keys(G).forEach(k => { B[k] = B[k] || {}; B[k].gentle = G[k]; });
})(typeof window !== 'undefined' ? window : globalThis);
