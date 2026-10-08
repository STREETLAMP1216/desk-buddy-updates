// 책상 친구 — who the character is. Shown on the profile card in settings.
// (One object per character; switching characters will pick from this list later.)
(function (root) {
  const CHARACTERS = {
    shiori: {
      id: 'shiori',
      name: '시오리',
      names: { en: 'Shiori', ja: 'しおり' },
      hanja: '栞 · 책갈피',
      theme: { mint: '#A8DCC6', deep: '#4E8A6B', hover: '#95D0B6', soft: '#F2F7F4', line: '#D6DED9' },
      quote: '어디까지 했는지는 내가 기억해 둘게.',
      facts: [
        ['성격', '말수 적은 무표정 쿨데레. 담담하지만 네가 적은 할 일은 끝까지 기억해 둬. 칭찬은 짧게, 진심으로.'],
        ['좋아하는 것', '따뜻한 차, 조용한 새벽, 수첩에 X가 늘어나는 것'],
        ['싫어하는 것', '시끄러운 알람, "나중에"가 세 번 넘어가는 것'],
        ['같이 있는 애', '새싹이 — 노트북 뒤에서 자주 엿봐'],
        ['버릇', '음악 틀면 말없이 헤드폰 낌. 밤엔 똥머리']
      ]
    },
    fubuki: {
      id: 'fubuki',
      name: '후부키',
      names: { en: 'Fubuki', ja: 'ふぶき' },
      hanja: '吹雪 · 눈보라',
      theme: { mint: '#EBDB9C', deep: '#8A7224', hover: '#E0CD80', soft: '#FAF6E8', line: '#E5DDC4' },
      quote: '미룬 거? 로그에 다 남아 있어.',
      facts: [
        ['성격', '건방지고 무표정한 해커. 놀리듯 말하지만 결국 끝까지 챙겨줘. 칭찬은 한 번만, 대신 진짜일 때만.'],
        ['좋아하는 것', '에너지 드링크, 젤리, 할 일 목록이 0개가 되는 순간'],
        ['싫어하는 것', '저장 안 하고 끄는 것, 렌더 진행 막대 쳐다보기'],
        ['같이 있는 애', '눈알 드론 — 젤리를 자주 훔쳐 먹어'],
        ['버릇', '아침엔 머리 풀고 boot up, 첫 할 일 끝내면 포니테일로 묶음. 밤엔 "still online"']
      ]
    },
    suu: {
      id: 'suu',
      name: '수우',
      names: { en: 'Suu', ja: 'すう' },
      hanja: '水 · 물',
      theme: { mint: '#AAC7E7', deep: '#3E679A', hover: '#93B5DD', soft: '#F0F4FA', line: '#D3DCE8' },
      quote: '하나만 하자! 하나 하면 둘은 금방이야.',
      facts: [
        ['성격', '해맑은 인싸 응원단장. 시작이 제일 어렵다는 걸 알아서, 첫 한 발을 같이 떼 줘. 칭찬은 크게, 자주.'],
        ['좋아하는 것', '아이스 아메리카노, 메론빵, 산책, 수첩에 X가 줄줄이 생기는 것'],
        ['싫어하는 것', '혼자 끙끙대는 것, 밥 거르는 것'],
        ['같이 있는 애', '왕꼬 — 골든 리트리버 강아지. 간식 냄새에 제일 먼저 달려와'],
        ['버릇', '아침엔 안경 없이 멍하다가, 첫 할 일 끝내면 안경 쓰고 시동. 음악 틀면 헤드폰 끼고 리듬 탐']
      ]
    }
  };
  const api = { CHARACTERS, current: CHARACTERS.shiori };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Character = api;
})(typeof window !== 'undefined' ? window : globalThis);
