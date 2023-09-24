// express 라이브러리 안의 Router 라는 함수를 갖다 쓰곘다.
// 다른 파일이나 라이브러리를 이 파일에 첨부하겠습니다.
// require('라이브러리명')
var router = require('express').Router();

// 미들웨어 구문
function ConfirmLogin(req, res, next) {
    // req. user 가 있는지 검사 -> next () -> 그냥 통과
    if (req.user) {
        next()
    } else {
        res.send('로그인 안하셨는데요.')
    }
}

// 모든 라우터에 적용하는 미들웨어.
router.use(ConfirmLogin);

// route 정리 방법.
// app 대신에 router 라는 함수 사용.
router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
});

router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
}); 

// 자바스크립트 파일을 다른 파일에서 갖다 쓸 떄.
// module.exports = 내보낼 변수명
// (어떤 변수를 배출하겠습니다.) = (배출할 변수명)
module.exports = router;


