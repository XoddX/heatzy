# heatzy

A module for interacting with Heatzy devices

*Note : Only Pilote devices (Gen 1 & 2) are supported for now*

### Installation

```bash
$ npm install heatzy --save
```

### Usage

#### Init
```javascript
const Heatzy = require('heatzy');

const heatzy = new Heatzy('my@email.com', 'mysecretpassword');
```

#### Get Devices
```javascript
heatzy.
  .getDevices()
  .then((devices) => {
    devices.forEach((device) => {
      console.log('device data:', device.data);
    });
  })
  .catch((error) => {
    console.error(error);
  });
```

### Device API
```javascript
device.on();
device.off();
device.eco();
device.confort();
device.hgel();
device.mode;/*Device mode*/
device.infos;/*Device data*/
device.data;/*Device data point*/
device.refreshData();
```
**Only for Pilote Gen 2 :**
```javascript
device.startBoost(5/*minutes*/);
device.stopBoost();
device.startScheduler();
device.stopScheduler();
device.startHolidays(5/*days*/);
device.stopHolidays();
device.lock();
device.unlock();
```
Method return Promise\<Device\>
