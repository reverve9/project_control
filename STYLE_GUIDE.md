# Project Control 스타일 가이드

CSS 변수 매핑 및 적용 위치 참조 문서

---

## 컬러 변수

| 변수 | 값 | 적용 위치 |
|------|-----|----------|
| `--navy` | #2c3e50 | 로고 텍스트, 타이틀, 진행률 숫자, 버튼 배경, 활성 nav, hover 보더 |
| `--navy-light` | #34495e | 버튼 hover 배경 |
| `--blue` | #3498db | 링크 hover, input focus 보더, 진행바 |
| `--blue-muted` | #5a7a94 | 메모카드 hover 보더, 세컨더리 버튼 배경 |
| `--orange` | #e67e22 | (예비) |
| `--bg-primary` | #f8f9fa | 앱 배경, 카드 내부 배경, 인풋 배경 |
| `--bg-secondary` | #ffffff | 사이드바, 카드, 모달 배경 |
| `--text-primary` | #2c3e50 | 본문 텍스트, 프로젝트명, 메모 타이틀 |
| `--text-secondary` | #7f8c8d | 라벨, 서브타이틀, 카운트, 아이콘 |
| `--text-muted` | #95a5a6 | 메모 날짜, 전체메모 날짜 |
| `--text-light` | #bdc3c7 | placeholder 텍스트 |
| `--text-black` | #000000 | 상세내용 텍스트 |
| `--border` | #e0e4e8 | 모든 보더, 구분선 |
| `--border-light` | #cccccc | 스크롤바, 인포박스 스크롤 |
| `--success` | #27ae60 | 완료 체크박스, 완료 숫자 |
| `--warning` | #f39c12 | 진행중 숫자, 마감임박 |
| `--danger` | #e74c3c | 삭제 버튼, 위험 버튼 |
| `--danger-hover` | #c0392b | 삭제 버튼 hover |
| `--danger-bg` | #ffebee | 삭제 버튼 hover 배경 |
| `--white` | #ffffff | 버튼 텍스트, 체크 아이콘 |
| `--active-bg` | #eef3f7 | 활성 프로젝트 아이템 배경 |

---

## 폰트 사이즈 변수

| 변수 | 값 | 적용 위치 |
|------|-----|----------|
| `--font-12` | 12px | 전체메모 날짜, 전체메모 프로젝트명 |
| `--font-13` | 13px | 서브타이틀, 사이드바 섹션, 메모 날짜, 인포 라벨/값, placeholder |
| `--font-14` | 14px | 통계 라벨, 타입버튼, 새프로젝트 버튼, 전체메모 타이틀, 상세내용, 진행률% |
| `--font-15` | 15px | 프로젝트명, 카드헤더 타이틀, 인포 타이틀, 메모 타이틀 |
| `--font-16` | 16px | nav, 카운트, 빈상태, 메모카드 타이틀, 버튼, 폼라벨, 인풋 |
| `--font-19` | 19px | 사이드바 로고, 모달 타이틀 |
| `--font-20` | 20px | 페이지 타이틀 |
| `--font-21` | 21px | 서클 유닛(%), 서클 통계값 |
| `--font-25` | 25px | 통계 숫자 |
| `--font-28` | 28px | 프로젝트 서클 진행률 숫자 |
| `--font-43` | 43px | 대시보드 서클 진행률 숫자 |

---

## 폰트 웨이트 변수

| 변수 | 값 | 적용 위치 |
|------|-----|----------|
| `--weight-100` | 100 | 상세내용, placeholder |
| `--weight-200` | 200 | 인포값, 상세 에디트 |
| `--weight-300` | 300 | 메모 날짜 |
| `--weight-500` | 500 | nav, 라벨, 버튼, 전체메모 타이틀, 진행률% |
| `--weight-600` | 600 | 로고, 타이틀, 카드헤더 |
| `--weight-700` | 700 | 통계 숫자, 서클 진행률 |

---

## 수정 예시

### 상세내용 폰트 조정
```css
/* style.css */
.detail-content {
  font-size: var(--font-14);  /* 14px → 15px로 변경시 --font-15 */
  font-weight: var(--weight-100);  /* 100 → 200으로 변경시 --weight-200 */
  color: var(--text-black);  /* 검정 → 회색으로 변경시 --text-primary */
}
```

### 새 폰트 사이즈 추가
```css
:root {
  --font-17: 17px;  /* 필요시 추가 */
}
```

---

## 파일 위치
- CSS: `src/style.css`
- 이 문서: `STYLE_GUIDE.md`
