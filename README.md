# CharaWiki v3.3

나무위키 스타일의 캐릭터 위키 빌더. 빌드 도구 없이 바로 동작하는 Vanilla JS 프로젝트.

## 파일 구조

```
index.html   — 전체 HTML 구조
style.css    — 테마 + 반응형 스타일
script.js    — 앱 전체 로직
README.md    — 이 파일
```

외부 의존성 없음. `index.html`을 브라우저로 열기만 하면 됩니다.

## 주요 기능

- 멀티 캐릭터 (생성/삭제/검색/전환)
- 캐릭터별 독립 설정 (테마, 레이아웃, 데이터)
- 하위 페이지 무제한 (탭으로 전환)
- 섹션 11종: 텍스트 / 목록 / 능력치 / 인물관계 / 타임라인 / 어록 / 갤러리 / 유튜브 / 외부링크 / 스포일러 / 표
- 인포박스 (이미지 + 항목 + 소제목, 4종 필터)
- 테마 8종 + 강조색 + 폰트 3종 + 글자 크기 조절
- 인포박스 스타일 3종 / 레이아웃 3종 / 배경 패턴 4종 / 구분선 4종
- 자동 저장 (0.8초 디바운스, localStorage)
- JSON 백업 내보내기/불러오기
- URL 공유 (이미지 제외, 읽기 전용)
- 읽기 진행 바 / 맨 위로 / 자동 목차 / 라이트박스 / 토스트
- 드래그 앤 드롭 섹션 순서 변경
- 단축키: `Ctrl+S` 저장, `Ctrl+E` 편집 모드 토글
- 완전 반응형 (360 / 480 / 768 / 1024 / 1200+) + iPhone Safe Area
- `prefers-reduced-motion` / 인쇄 최적화

## 사용법

1. 우측 상단 **✏️ 편집** 버튼을 눌러 편집 모드 진입
2. 인포박스/제목/태그/섹션 내용을 클릭해서 인라인 편집
3. **+ 섹션 추가** 영역에서 원하는 타입 클릭
4. **🎨 테마 / ✨ 꾸미기** 패널은 편집 모드와 무관하게 항상 사용 가능
5. 사이드바에서 **+ 새 캐릭터**로 캐릭터 추가, **⬇ 백업**으로 JSON 내보내기

## 데이터 구조

```js
store = {
  chars: [{
    id, name, subtitle, cover, avatar,
    tags, categories,
    settings: { theme, accent, font, infobox, layout, pattern, divider, fontSize },
    infobox: { image, imageFilter, caption, rows: [{type:'sub'|'row', ...}] },
    pages: { [pageId]: { id, name, sections: [...] } },
    pageOrder: [pageId, ...],
    activePage: pageId
  }],
  activeId, settings
}
```

## GitHub Pages 배포

1. 저장소 만들고 4개 파일 push
2. Settings → Pages → Source: `main` / `(root)` 선택
3. 잠시 후 `https://<유저명>.github.io/<저장소>/` 로 접속

## 라이선스

MIT
