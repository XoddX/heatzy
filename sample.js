const Heatzy = require('.');

require('dotenv').config();

const login = process.env.LOGIN;
const password = process.env.PASS;

let heatzy = new Heatzy(login,password);

heatzy
    .getDevices()
    .then((devices) => {
        return Promise.all(devices.map((device) => {
            return device.off()
                .then((device) => {
                    return device.lock();
                })
        }));
    })
    .then((devices) => {
        devices.forEach((device) => {
            console.log('Device with name :',device.name);
            console.log(JSON.stringify(device.data,null,4));
        });
    })
    .catch((error) => {
        console.log('Error : ',error);
    });