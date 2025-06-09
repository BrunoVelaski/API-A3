function verificarAdmin(req, res, next) {
  if (!req.usuario || !req.usuario.isAdmin) {
    return res.status(403).json({ mensagem: 'Acesso negado: apenas administradores podem fazer isso' });
  }
  next();
}

export { verificarAdmin };
