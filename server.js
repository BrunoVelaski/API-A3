import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import Usuario from './models/Usuario.js';
import Carro from './models/Carro.js';
import { autenticarToken } from './auth.js';
import { verificarAdmin } from './verificarAdmin.js';

const app = express();
app.use(bodyParser.json());

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Está conectado ao banco'))
  .catch(err => console.error('Erro ao conectar ao Servidor:', err));

/* 
Registro do Usuário
Coloque isso no Headers la no Thunder
Authorization ------ Bearer (token gerado)
*/

app.post('/registro', async (req, res) => {
  const { nome, senha } = req.body;
  console.log('Registrando usuário:', nome);

  const usuarioExistente = await Usuario.findOne({ nome });
  if (usuarioExistente) {
    return res.status(400).json({ mensagem: 'Usuário já existe' });
  }

  const novoUsuario = new Usuario({ nome, senha });
  await novoUsuario.save();

  res.status(201).json({ mensagem: 'Usuário registrado com sucesso' });
});

app.post('/login', async (req, res) => {
  const { nome, senha } = req.body;
  const usuario = await Usuario.findOne({ nome, senha });
  if (!usuario) return res.status(401).json({ mensagem: 'Credenciais inválidas' });

  const isAdmin = usuario.nome === 'admin';

  const token = jwt.sign({ nome: usuario.nome, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});


//Rota protegida: listar carros
app.get('/carros', autenticarToken, async (req, res) => {
  const carros = await Carro.find();
  res.json(carros);
});

// Listar todos os usuários
app.get('/usuarios', autenticarToken, async (req, res) => {
  //const usuarios = await Usuario.find({}, '-senha'); 
  const usuarios = await Usuario.find(); //USO ISTO PQ ESQUEÇO DA SENHA Q COLOQUEI, MAS O CORRETO ESTA NA LINHA ACIMA.
  res.json(usuarios);
});

//Inserir carros 
app.post('/carros', autenticarToken, async (req, res) => {
  const novoCarro = new Carro(req.body);
  await novoCarro.save();
  res.status(201).json(novoCarro);
});

// Deletar um usuário (só admin pode fazer isso)
app.delete('/usuarios/:id', autenticarToken, verificarAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });

    res.json({ mensagem: 'Usuário deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao deletar usuário', erro: err.message });
  }
});


//Deletar Carro por ID
app.delete('/carros/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const carro = await Carro.findByIdAndDelete(id);
    if (!carro) {
      return res.status(404).json({ mensagem: 'Carro não encontrado' });
    }
    res.json({ mensagem: 'Carro deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao deletar carro', erro: err.message });
  }
});

//Atualizar carro por ID
app.put('/carros/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;

    const carro = await Carro.findByIdAndUpdate(id, dadosAtualizados, { new: true, runValidators: true });

    if (!carro) {
      return res.status(404).json({ mensagem: 'Carro não encontrado' });
    }

    res.json(carro);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao atualizar carro', erro: err.message });
  }
});


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
