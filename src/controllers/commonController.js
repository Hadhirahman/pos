
const userschema = require("../models/userschema")
const MenuSchema = require("../models/menuSchema")
const staffModel = require("../models/staffscema")


const bcrypt = require("bcrypt")
const twilio = require("../utility/Otp/twilo")
const varifyotp = require("../utility/Otp/twilioOtpvarify")


const jwt = require("jsonwebtoken")
const routerObj = {
  signup: async (req, res) => {
    const { restaurantName, userName, contact, email, password, otp, sendViaPhone } = req.body
    try {

      const existingUser = await userschema.findOne({
        contact: sendViaPhone ? contact : email
      });

      const existinguserName = await userschema.findOne({ userName: userName })
      if (existinguserName) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      if (existingUser) {
        return res.status(400).json({ message: 'User with the provided contact already exists' });
      }

      const hashedPass = await bcrypt.hash(password, 10)

      const newUser = new userschema({
        restaurantName: restaurantName,
        userName: userName,
        contact: sendViaPhone ? contact : email,
        password: hashedPass
      });



      await newUser.save();
      const payload = contact
      const token = jwt.sign({ payload }, process.env.TOCKEN_SECRET_KEY, { expiresIn: "1h" })
      res.status(201).json({ message: 'User created successfully', token });



    } catch (error) {
      console.error('Error in signup:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  sentotp: async (req, res) => {
    try {
      const { contact } = req.body
      console.log(contact);
      const existcontact=await userschema.findOne({contact:contact})
      if(existcontact){
        return res.status(401).json({ message: 'Contact already exist' });
      }
      twilio(contact, res)

    } catch (error) {
      res.status(404).json({ status: false });
    }
  },

  varifyOTP: async (req, res) => {
    try {
      const { otp, contact } = req.body
      console.log(otp, contact);
      varifyotp(contact, otp, res)

    } catch {
      res.status(404).json({ status: false });
    }
  },


  login: async (req, res) => {
    const { userName, password } = req.body;

    console.log(userName, password);
    const user = await userschema.findOne({ userName: userName });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        const payload = userName
        const token = jwt.sign({ payload }, process.env.TOCKEN_SECRET_KEY, { expiresIn: "1h" })
        res.status(201).json({ message: 'User login successfully', token });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },



  CreateMenuItems: async (req, res) => {
    try {
      const { name, description, price, category, imageURL } = req.body;
      const menuItem = new MenuSchema({
        name,
        description,
        price,
        category,
        imageURL
      });
      await menuItem.save();

      res.status(201).json({ message: 'Menu item created successfully', menuItem });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },



  submitStaffForm: async (req, res) => {
    const formData = req.body;

    try {
      const exists = await staffModel.findOne({ phoneNumber: formData.phoneNumber });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      }

      const newStaff = new staffModel(formData);
      await newStaff.save();
      console.log('Received form data:', formData);
      res.json({ success: true, message: 'Form data received and saved successfully' });
    } catch (error) {
      console.error('Error handling staff form submission:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  ListStaff: async (req, res) => {
    try {

      const allStaff = await staffModel.find();
      console.log(allStaff);

      res.json(allStaff);
    } catch (error) {
      console.error('Error fetching staff members:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  DeleteStaff: async (req, res) => {
    const staffId = req.params.id;

    try {
      // Check if the staff member exists
      const staffMember = await staffModel.findById(staffId);
      if (!staffMember) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      // Delete the staff member
      await staffModel.findByIdAndDelete(staffId);

      res.json({ success: true, message: 'Staff member deleted successfully' });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  EditStaff: async (req, res) => {
    const staffId = req.params.id;
    const updatedData = req.body;

    try {
      // Check if the staff member exists
      const staffMember = await staffModel.findById(staffId);
      if (!staffMember) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      // Update the staff member's data
      res.json(staffMember)


      // res.json({ success: true, message: 'Staff member updated successfully' });
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  updateStaff: async (req, res) => {
    const formData = req.body;
    const id = req.params.id;
    try {
      const existingStaff = await staffModel.findById(id);
      if (!existingStaff) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      existingStaff.set(formData);

      await existingStaff.save();

      console.log('Updated staff data:', existingStaff);
      res.json({ success: true, message: 'Staff data updated successfully', data: existingStaff });
    } catch (error) {
      console.error('Error updating staff data:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },




  

}
module.exports = routerObj