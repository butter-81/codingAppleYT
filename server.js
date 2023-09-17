// 기본 문법, 3줄 써놓고 시작하면 됨

// 라이브러리 첨부
const express = require('express');
// app 이라는 객체 만듦
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
app.use(bodyParser.urlencoded({extended : true}));
app.set('vire engine', 'ejs');
app.use('/public', express.static('public'));

// driver 5.0 이상 버전에서 문법 바뀌어서 밑 코드로 하면 콜백 함수 실행을 안 함 -> API 4.0 으로 함

var db;
MongoClient.connect('mongodb+srv://kimbutter:0904@cluster0.r9djedc.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client) {
    if (에러) return console.log(에러)
    db = client.db('todoapp');

    app.listen(8080, function () {
        console.log('listening on 8080')
    });
});

// function (요청, 응답)
app.get('/pet', function(req, rep) {
    rep.send('pet용품 쇼핑할 수 있는 페이지입니다.');
})

// get() 여러 개로 경로를 많이 생성 가능
app.get('/beauty', function(req, rep) {
    rep.send('beauty 용품을 쇼핑할 수 있는 페이지입니다.');
})

app.get('/', function(req, rep) {
    rep.sendFile(__dirname + '/index.html');
})

app.get('/write', function(req, rep) {
    rep.sendFile(__dirname + '/write.html');
})

app.post('/add', function(req, res) {
    res.send('전송완료');
    // 쿼리문 ; name이 게시물갯수인 데이터를 찾아주세요.
    db.collection('counter').findOne({name : '게시물갯수'}, function(err, re){
        console.log(re);
        var totalPost = re.totalPost; 

        db.collection('post').insertOne({ _id : totalPost + 1, title:req.body.title, date:req.body.date}, function(err, re) {
            console.log('저장 완료');
            // counter collection 안의 totalPost +1
            // updateOne(어떤 데이터를 수정할지, 수정값(오퍼레이터를 써야 함), func)
            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost : 1}}, function(err, re){
                if (err) { return console.log(err);}
            });
        })
    });
}); 

app.get('/list', function(req, res) {
    // db에 저장된 post 라는 collection 안의 (...)한 데이터를 꺼내주세요.
    db.collection('post').find().toArray(function(err, re) {
        console.log(re);
        // posts 라는 변수에 갖고온 데이터를 담아서 렌더링
        res.render('list.ejs', { posts : re });
    });
});

app.delete('/delete', function(req, res){
    console.log(req.body);
    // id가 문자로 담겨왓으므로 숫자로 바꿔줌
    req.body._id = parseInt(req.body._id);
    // req.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제하기
    db.collection('post').deleteOne(req.body, function(err, re){
        console.log('삭제완료');
        // 서버에서 응답코드 보내주세요 ~
        // 200 : 응답이 성공적
        // 400 : 요청이 실패
        // send(___) : ___ 같이 보내주세요 ~ 
        // 터미널 상의 콘솔
        res.status(200).send({ message : '성공했습니다.' });
    })
})

app.get('/detail/:id', function(req, res) {
    
    var index = parseInt(req.params.id);
    // 위의 :id == req.params.id
    db.collection('post').findOne({_id : index}, function(err, re) {
        console.log(re);
        res.render('detail.ejs', { data : re })
    })
});