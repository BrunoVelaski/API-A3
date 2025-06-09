import mongoose from 'mongoose';

const carroSchema = new mongoose.Schema({
  marca: String,
  modelo: String,
  ano: Number
});

export default mongoose.model('Carro', carroSchema);