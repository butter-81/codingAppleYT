// 기본 문법, 3줄 써놓고 시작하면 됨

// 라이브러리 첨부
const express = require('express');
// app 이라는 객체 만듦
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
// delete, modify 가능하게 하는 라이브러리
const methodOverride = require('method-override')

const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);

app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended : true}));
app.set('vire engine', 'ejs');
//app.use('/public', express.static('public'));
require('dotenv').config();

// driver 5.0 이상 버전에서 문법 바뀌어서 밑 코드로 하면 콜백 함수 실행을 안 함 -> API 4.0 으로 함

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client) {
    if (에러) return console.log(에러)
    db = client.db('todoapp');

    http.listen(process.env.PORT, function () {
        console.log('listening on 8080')
    });
});

// client-side rendering
app.use(express.static(path.join(__dirname, 'codingAppleReact/my-app/build')))

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'codingAppleReact/my-app/build/index.html'))
})

// function (요청, 응답)
app.get('/pet', function(req, rep) {
    rep.send('pet용품 쇼핑할 수 있는 페이지입니다.');
})

// get() 여러 개로 경로를 많이 생성 가능
app.get('/beauty', function(req, rep) {
    rep.send('beauty 용품을 쇼핑할 수 있는 페이지입니다.');
})

// app.get('/', function(req, res) {
//     console.log(res);
//     res.render('index.ejs');
// })

app.get('/write', function(req, res) {
    //console.log(res);
    res.render('write.ejs');
})


app.get('/list', function(req, res) {
    // db에 저장된 post 라는 collection 안의 (...)한 데이터를 꺼내주세요.
    db.collection('post').find().toArray(function(err, re) {
        //console.log(re);
        // posts 라는 변수에 갖고온 데이터를 담아서 렌더링
        res.render('list.ejs', { posts : re });
    });
});


app.get('/search', (req, res) => {
    var search_con = [
        {
        $search: {
            index: 'titleSearch',
            text: {
            query: req.query.value,
            path: 'title'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
        }
        },
        // 내림차순으로 정렬
        { $sort : {_id : -1}},
    ] 
    console.log(req.query);    
    // text라는 연산자와 search 라는 연산자. 
    // 기본적으로 띄어쓰기 기준으로 단어를 나눠서, 조사 붙어있는 경우 엔진이 구분 못 함 -> search 인덱스 만들어 한국어 친화적으로 검색 가능
    // -> 서버에서 한국어 전용 서치엔진 사용
    // aggregate ([{검색조건1}, {검색조건2}..])
    db.collection('post').aggregate(search_con).toArray((err, re) => {
        console.log(re);
        res.render('search.ejs', {posts : re});
    });
})


app.get('/detail/:id', function(req, res) {
    
    var index = parseInt(req.params.id);
    // 위의 :id == req.params.id
    db.collection('post').findOne({_id : index}, function(err, re) {
        //console.log(re);
        res.render('detail.ejs', { data : re })
    })
});


// :id 추가 -> 숫자 또는 문자 (파라미터) url 뒤에다 붙여서 데이터마다 edit 페이지를 만들지 않아도 되게 함.
app.get('/edit/:id', function(req, res) {
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, re){
        //console.log(re);
        res.render('edit.ejs', { posts : re });
    }) 
})

app.put('/edit', function(req, res) {
    // 폼에 담긴 제목 데이터, 날짜 데이터를 가지고 db.collection 에다가 업데이트 함.
    // body (ejs 파일) 중에서 이름이 id 인 값을 선택
    db.collection('post').updateOne({_id : parseInt(req.body.id) }, { $set : {title : req.body.title, date : req.body.date} }, function(err, re) {
        console.log('수정완료');
        // 서버에서 반드시 응답해줘야 함. 그렇지 않으면 페이지가 멈춘다.
        res.redirect('/');
    })
})


const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res) {
    res.render('login.ejs');
});

// passport : login을 쉽게 하도록 도와주는 함수
// passport.authenticate ('local', {실패 시 실행}, (성공 시 실행)) -> local 방식으로 아이디/비번 검사
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res) {
    res.redirect('/')
}) 

// 중간에 미들웨어 들어가는 것 확인 (ConfirmLogin)
app.get('/mypage', ConfirmLogin, function(req, res) {
    // req.user 출력 이상하게 됨..
    console.log(req.user);
    res.render('mypage.ejs', {user : req.user});
});

// 미들웨어 구문
function ConfirmLogin(req, res, next) {
    // req. user 가 있는지 검사 -> next () -> 그냥 통과
    if (req.user) {
        next()
    } else {
        res.send('로그인 안하셨는데요.')
    }
}


// 보통 이 코드 그냥 복붙해서 씀.
passport.use(new LocalStrategy({
    // user가 입력한 아이디와 패스워드 정의 (form 에 입력한 name 값)
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
    // 윗줄까지 세팅.
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    // 모든 경우가 return done() 으로 끝나는데 파라미터가 다름.
    // done (err, result (사용자 데이터), 에러메세지 넣는 곳)
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)
    // 결과가 없다 == 똑같은 id 가 존재하지 않는다.
    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    // 똑같은 id 가 있다. -> 비번이랑 비교
    // db에서 꺼내 바로 비교 중 -> 보안이 쓰레기. 암호화 과정 필수 (나중에)
    if (입력한비번 == 결과.pw) {
        return done(null, 결과)
    } else {
        return done(null, false, { message: '비번틀렸어요' })
    }
    })
}));

// 세션 저장시키는 코드 (이해하지말래요 그냥 복붙하래요)
// id 를 이용해서 세션을 저장시키는 코드 (로그인 성공 시 발동)
// 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보냄
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요
// 세션에 이 사람이 있는지 없는지 확인
// 마이페이지 접속 시 발동
passport.deserializeUser(function (_id, done) {
    db.collection('login').findOne({id : _id}, function(err, re) {
        done(null, re);
    });
    done(null, {})
}); 

// passport 밑에 있어야 잘 돌아감
app.post('/register', function(req, res) {
    // 저장 전에 id 가 이미 있는지 먼저 찾아봐야 함
    // id 에 알파벳 숫자만 잘 들어있나 화긴
    // 비번 저장 전에 암호화
    db.collection('login').insertOne( {id : req.body.id, pw : req.body.pw }, function(err, re) {
        req.redirect('/')
    })
})

app.post('/add', function(req, res) {
    res.send('전송완료');
    // 쿼리문 ; name이 게시물갯수인 데이터를 찾아주세요.
    db.collection('counter').findOne({name : '게시물갯수'}, function(err, re){
        //console.log(re);
        var totalPost = re.totalPost; 

        var saved = { _id : totalPost + 1, title:req.body.title, date:req.body.date, writer : req.user._id}

        db.collection('post').insertOne(saved, function(err, re) {
            console.log('저장 완료');
            // counter collection 안의 totalPost +1
            // updateOne(어떤 데이터를 수정할지, 수정값(오퍼레이터를 써야 함), func)
            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost : 1}}, function(err, re){
                if (err) { return console.log(err);}
            });
        })
    });
}); 

app.delete('/delete', function(req, res){
    //console.log(req.body);
    // id가 문자로 담겨왓으므로 숫자로 바꿔줌
    req.body._id = parseInt(req.body._id);

    var deletedData = {_id : req.body._id, writer : req.user._id}

    // req.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제하기
    db.collection('post').deleteOne(deletedData, function(err, re){
        console.log('삭제완료');
        if (err) {console.log(err)};
        // 서버에서 응답코드 보내주세요 ~
        // 200 : 응답이 성공적
        // 400 : 요청이 실패
        // send(___) : ___ 같이 보내주세요 ~ 
        // 터미널 상의 콘솔
        res.status(200).send({ message : '성공했습니다.' });
    })
})

// 경로명 현재 경로 (./) 로 시작하는 게 노드 js 국룰
// app.use -> 미들웨어 쓰고 싶을 떄 사용하는 것.
// 미들웨어 : 요청과 응답 사이에 사용하는 것.
// '/' 경로로 접속한 모든 페이지에 방금만든 라우터 적용.
// 유지보수가 쉬워짐. router 나누는 거 은근 자주 사용한다.
app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));


let multer = require('multer');
var storage = multer.diskStorage({  // 램에다가 저장해주세요-> 휘발성.

    destination : function(req, file, cb){
        cb(null, './public/image')
    },
    filename : function(req, file, cb){
        cb(null, file.originalname + '날짜' + newDate())
    }
}); 

// 미들웨어처럼 실행해주면 됨.
var upload = multer({storage : storage});

app.get('/upload', function(req, res) {
    res.render('upload.ejs');
})

// profile : input data 의 이름.
app.post('/upload', upload.single('profile'), function(req, res){
    res.send('업로드완료');
})

app.get('/image/:imageName', function(req, res) {
    res.sendFile(__dirname + '/public/image/' + req.params.imageName);
})
// 포스트가 안 됨 쉬팔... 왜 안 되는지 모르겠다
app.post('/chatroom', ConfirmLogin, function(요청, 응답){

    var 저장할거 = {
    title : '무슨무슨채팅방',
    member : [ObjectId(요청.body.당한사람id), 요청.user._id],
    date : new Date(),
    }

    db.collection('chatroom').insertOne(저장할거)
    .then(function(결과){
    응답.send('저장완료')
    });
});

app.get('/chat', ConfirmLogin, function(req, res) {
    db.collection('chatroom').find({member : req.user._id}).toArray().then((re) => {
        res.render('chat.ejs', {data : re})
    })
})

app.post('message', ConfirmLogin, function(req, res) {
    var 저장할거 = {
        parent : req.body.parent,
        content : req.body.content,
        userid : req.user._id,
        date : new Date(),
    }

    db.collection('message').insertOne(저장할거).then(()=>{
        console.log('DB 저장 성공');
        req.send('응답 성공');
    })
})

app.get('/message/:id', ConfirmLogin, function(req, res) {
    req.writeHead(200, {
        "Connection" : "keep-alive",
        "Content-Type" : "text/event-stream",
        "Cache-Control" : "no-cache",
    });

    db.collection('message').find({parent : req.params.id}).toArray()
    .then((re) => {
        res.write('event : test\n');
        // JSON은 문자 취급을 받는다.
        res.write('data : ' + JSON.stringify(re) + '\n\n');
    })

    const pipeline = [
        { $match : { 'fullDocument.parent' : req.params.id } }
    ];
    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (result) => {
        req.write('data: ' + JSON.stringify(result.fullDocument) + '\n\n');
    })

})

app.get('/socket', function(req, res) {
    res.render('socket.ejs');
})

io.on('connection', function(socket) {
    console.log('유저접속됨');

    socket.on('room1-send', function(data) {
        io.to('room1').emit('broadcast', data);
    });

    // 채팅방 생성하고 user 집어넣어 줌.
    socket.on('joinroom', function(data) {
        socket.join('room1');
    });

    // data (메세지)를 여기저기 다 뿌림
    socket.on('user-send', function(data) {
        io.emit('broadcast', data)
    });
})