const validateFormData = (req, res, next) => {
    const formData  = req.body;
    console.log(formData);
    if (!formData || Object.keys(formData).length === 0) {
      return res.status(400).json({ error: 'Form data is required' });
    }
    next();
  };


module.exports = validateFormData;