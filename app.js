import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import Task from './models/Task.js';

mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));

const app = express();

const corsOptions = {
  origin: ['http://127.0.0.1:3000', 'https://netlify.com'],
};

// middleware 모든 요청에 공통적으로 적용한다.
app.use(express.json());
app.use(cors(corsOptions));

// useAsync hook
function asyncHandler(handler) {
  // 함수를 인수로 받아서 함수를 반환한다.
  const newHandler = async function(req, res) {
    try {
      await handler(req, res)
    } catch (e) {
      if (e.name === 'ValidationError') {
        res.status(400).send({ message: e.message});
      } else if (e.name === 'CastError') {
        res.status(404).send({ message: 'Cannot find given id.'});
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  }
  return newHandler;
}

app.post('/tasks', asyncHandler(async (req, res) => {
    const newTask = await Task.create(req.body)
    res.status(201).send(newTask);
}));

app.get('/tasks', asyncHandler(async (req, res) => {
  const sort = req.query.sort;
  const count = Number(req.query.count);
  const sortOption = { createdAt: sort === 'oldest' ? 'asc' : 'desc' };
  const tasks = await Task.find().sort(sortOption).limit(count);
  res.send(tasks);
}));

app.get('/tasks/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const task = await Task.findById(id); // id string
  if (task) {
    res.send(task);
  } else {
    res.status(404).send({ message: '없습니다' }); 
  }
}));

// PUT 
app.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const task = await Task.findById(id); // DB로부터 데이터를 가져왔다.
  if (task) {
    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key]; // 그 데이터를 수정했다. 이때 실제 디비에 반영이 될까요?
    });
    const updatedTask = await task.save(); // 디비와 동기화(변경을 전송)
    console.log('T', task);
    console.log('U', updatedTask);
    // res HTTP 응답을 클라이언트에 보내는 것이다.
    res.send(task);
  } else {
    res.status(404).send({ message: '없습니다' }); 
  } 
}));

app.delete('/tasks/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const task = await Task.findByIdAndDelete(id);
  console.log('task', task);
  if (task) {
    res.sendStatus(204);
  } else {
    res.status(404).send({ message: '없습니다' }); 
  }
}));

app.listen(process.env.PORT, () => console.log("Server on"));
console.log('Hi');