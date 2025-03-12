require('dotenv').config();
var db = require("../models/index");
const { User, Role } = db;
const bcrypt = require('bcryptjs');
const sequelize = db.sequelize;

const seedSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const superAdminRole = await Role.findOne({ where: { name: 'superAdmin' } });
    
    if (!superAdminRole) {
      console.log('SuperAdmin role does not exist. Creating it...');
      await Role.create({ name: 'superAdmin' });
      console.log('SuperAdmin role created.');
    }

    const role = await Role.findOne({ where: { name: 'superAdmin' } });
    
    const existingSuperAdmin = await User.findOne({
      include: [
        {
          model: Role,
          as: 'role',
          where: { name: 'superAdmin' }
        }
      ]
    });
    
    if (existingSuperAdmin) {
      console.log('SuperAdmin user already exists.');
      return;
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', salt);
    
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: hashedPassword,
      roleId: role.id,
      status: 'active'
    });
    
    console.log('SuperAdmin user created successfully.');
    console.log('Email: superadmin@example.com');
    console.log('Password: SuperAdmin@123');
    
  } catch (error) {
    console.error('Error seeding SuperAdmin:', error);
  } finally {
    process.exit(0);
  }
};

seedSuperAdmin();