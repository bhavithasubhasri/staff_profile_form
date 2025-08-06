const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/uploads', express.static('uploads'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/staffmanagement';

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB successfully');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});


const staffSchema = new mongoose.Schema({
   
    staff_code: { type: String, required: true, unique: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    gender: String,
    birthday: Date,
    email: { type: String, required: true },
    phone: String,
    workplace: String,
    status: { type: String, required: true },
    job_position: { type: String, required: true },
    direct_manager: String,
    role: String,
    academic_level: String,
    hourly_rate: String,
    default_language: String,
    direction: String,
    email_signature: String,
    other_information: String,
    twilio_phone_number: String,
    twilio_whatsapp: String,
    profile_image: String,
    
   
    domicile: String,
    marital_status: String,
    current_address: String,
    nation: String,
    place_of_birth: String,
    religion: String,
    citizen_id: String,
    date_of_issue: Date,
    place_of_issue: String,
    resident: String,
    bank_account_number: String,
    bank_account_name: String,
    bank_name: String,
    personal_tax_code: String,
    epf_no: String,
    social_security_no: String,
    facebook: String,
    linkedin: String,
    skype: String
}, {
    timestamps: true
});

const Staff = mongoose.model('Staff', staffSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve staff list page
app.get('/staff-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'staff-list.html'));
});

// Create staff profile
app.post('/admin', upload.single('profileUpload'), async (req, res) => {
    try {
        const staffData = {
            staff_code: req.body.staff_code,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            gender: req.body.Gender,
            birthday: req.body.birthday,
            email: req.body.email,
            phone: req.body.phone,
            workplace: req.body.workplace,
            status: req.body.status,
            job_position: req.body.job_position,
            direct_manager: req.body.direct_manager,
            role: req.body.role,
            academic_level: req.body.academic_level,
            hourly_rate: req.body.hourly_rate,
            default_language: req.body.default_language,
            direction: req.body.direction,
            email_signature: req.body.email_signature,
            other_information: req.body.other_information,
            twilio_phone_number: req.body.Twilio_Phone_Number,
            twilio_whatsapp: req.body.Twilio_whatsapp,
            domicile: req.body.domicile,
            marital_status: req.body.marital_status,
            current_address: req.body.current_address,
            nation: req.body.nation,
            place_of_birth: req.body.place_of_birth,
            religion: req.body.religion,
            citizen_id: req.body.citizen_id,
            date_of_issue: req.body.date_of_issue,
            place_of_issue: req.body.place_of_issue,
            resident: req.body.resident,
            bank_account_number: req.body.bank_account_number,
            bank_account_name: req.body.bank_account_name,
            bank_name: req.body.bank_name,
            personal_tax_code: req.body.personal_tax_code,
            epf_no: req.body.epf_no,
            social_security_no: req.body.social_security_no,
            facebook: req.body.facebook,
            linkedin: req.body.linkedin,
            skype: req.body.skype
        };

        // Add profile image if uploaded
        if (req.file) {
            staffData.profile_image = req.file.filename;
        }

        const staff = new Staff(staffData);
        await staff.save();

        res.redirect(`/staff/${staff._id}`);
    } catch (error) {
        console.error('Error saving staff:', error);
        if (error.code === 11000) {
            res.status(400).send('Staff code already exists!');
        } else {
            res.status(500).send('Error saving staff profile: ' + error.message);
        }
    }
});

// Get all staff profiles
app.get('/staff', async (req, res) => {
    try {
        const staff = await Staff.find().sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single staff profile
app.get('/staff/:id', async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).send('Staff not found');
        }
        
        // Send HTML page to display staff profile
        const html = generateStaffProfileHTML(staff);
        res.send(html);
    } catch (error) {
        res.status(500).send('Error retrieving staff profile');
    }
});

// Update staff profile
app.put('/staff/:id', upload.single('profileUpload'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        if (req.file) {
            updateData.profile_image = req.file.filename;
        }

        const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        res.json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete staff profile
app.delete('/staff/:id', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        
        // Delete profile image if exists
        if (staff.profile_image) {
            const imagePath = path.join(__dirname, 'uploads', staff.profile_image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate HTML for staff profile display
function generateStaffProfileHTML(staff) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Staff Profile - ${staff.first_name} ${staff.last_name}</title>
  <link rel="stylesheet" href="/css/display.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  
</head>
<body>
  <div class="container">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="profile-card">
        <img src="${staff.profile_image ? '/uploads/' + staff.profile_image : 'https://www.w3schools.com/howto/img_avatar.png'}" class="profile-image" />
        <div class="profile-name">${staff.first_name}</div>

        <div class="social-icons">
          <a href="${staff.facebook}" target="_blank"><i class="fab fa-facebook"></i></a>
          <a href="${staff.skype}" target="_blank"><i class="fab fa-skype"></i></a>
          <a href="${staff.linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>
          <a href="mailto:${staff.email}" target="_blank"><i class="fas fa-envelope"></i></a>
        </div>

        <div class="info-line"><i class="fas fa-envelope"></i>${staff.email}</div>
        <div class="info-line"><i class="fas fa-phone"></i>${staff.phone}</div>
        <div class="info-line"><i class="fas fa-building"></i>${staff.workplace || 'N/A'}</div>
        <div class="info-line"><i class="fas fa-briefcase"></i>${staff.job_position || 'N/A'}</div>
        <div class="info-line"><i class="fas fa-user"></i><strong>Direct manager:</strong> ${staff.direct_manager || 'N/A'}</div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="section">
        <div class="section-title">General information</div>
        <table class="info-table">
          <tr><td>Staff code</td><td>${staff.staff_code}</td></tr>
          <tr><td>Staff name</td><td>${staff.first_name} ${staff.last_name}</td></tr>
          <tr><td>Gender</td><td>${staff.gender || 'N/A'}</td></tr>
          <tr><td>Birthday</td><td>${staff.birthday ? new Date(staff.birthday).toLocaleDateString() : 'N/A'}</td></tr>
          <tr><td>Phone</td><td>${staff.phone || 'N/A'}</td></tr>
          <tr><td>Workplace</td><td>${staff.workplace || 'N/A'}</td></tr>
          <tr><td>Status</td><td>${staff.status}</td></tr>
          <tr><td>Job position</td><td>${staff.job_position}</td></tr>
          <tr><td>Academic level</td><td>${staff.academic_level || 'N/A'}</td></tr>
          <tr><td>Hourly Rate</td><td>${staff.hourly_rate || 'N/A'}</td></tr>
          <tr><td>Religion</td><td>${staff.religion || 'N/A'}</td></tr>
          <tr><td>Nation</td><td>${staff.nation || 'N/A'}</td></tr>
          <tr><td>Marital status</td><td>${staff.marital_status || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Related information</div>
        <table class="info-table">
          <tr><td>Citizen identification</td><td>${staff.citizen_id || 'N/A'}</td></tr>
          <tr><td>Date of issue</td><td>${staff.date_of_issue ? new Date(staff.date_of_issue).toLocaleDateString() : 'N/A'}</td></tr>
          <tr><td>Place of birth</td><td>${staff.place_of_birth || 'N/A'}</td></tr>
          <tr><td>Current address</td><td>${staff.current_address || 'N/A'}</td></tr>
          <tr><td>Bank account number</td><td>${staff.bank_account_number || 'N/A'}</td></tr>
          <tr><td>Bank account name</td><td>${staff.bank_account_name || 'N/A'}</td></tr>
          <tr><td>Bank name</td><td>${staff.bank_name || 'N/A'}</td></tr>
          <tr><td>Personal tax code</td><td>${staff.personal_tax_code || 'N/A'}</td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
`;
}



// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});