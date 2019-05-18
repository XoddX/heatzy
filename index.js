const request = require('request');

const HOST = 'euapi.gizwits.com';
const HEATZYAPPID = 'c70a66ff039d41b4a220e198b0fcc8b3';

const PRODUCTS = {
    Heatzy: {
        productName : 'Heatzy',
        DECODE: {'停止' : 'OFF', '经济' : 'ECO', '解冻' : 'HGEL', '舒适' : 'CONFORT'},
        ENCODE: {'OFF':{'raw':[1,1,3]},'ECO':{'raw':[1,1,1]},'HGEL':{'raw':[1,1,2]},'CONFORT':{'raw':[1,1,0]}},
    },
    Pilote2: {
        productName : 'Pilote2',
        DECODE: {'stop' : 'OFF', 'eco' : 'ECO', 'fro' : 'HGEL', 'cft' : 'CONFORT'},
        ENCODE: {
            'OFF':{'attrs': {'mode':'stop'}},
            'ECO':{'attrs': {'mode':'eco'}},
            'HGEL':{'attrs': {'mode':'fro'}},
            'CONFORT':{'attrs': {'mode':'cft'}}
        }
    }
}

class HeatzyDevice {
    constructor(infos, client) {
        this.client = client;
        this.did = infos.did;
        this.name = infos.dev_alias;
        this.version = infos.product_name;
        this.infos = infos;
        this.data = {};
        this.mode = null;
        this.refreshData();
    }

    refreshData(){
        let self = this;
        return this.client({
            uri: `devdata/${this.did}/latest`
        }).then((body) => {
            this.data = body;
            this.mode = PRODUCTS[self.version].DECODE[body.attr.mode];
            return self;
        });
    }

    updateMode(mode) {
        let self = this;
        let body = PRODUCTS[self.version].ENCODE[mode];
        if(!body){
            return Promise.reject(`Mode ${mode} not supported.`);
        }
        return this.client({
            uri: `control/${this.did}`,
            method: 'POST',
            body: body
        })
        .then(() => {
            return self;
        })
    }

    toggleBoost(toggle, minutes) {
        let self = this;
        if(self.version !== PRODUCTS.Pilote2.productName){
            return Promise.reject("Boost mode only support for Pilote Gen 2");
        }
        let body = {
            derog_mode: toggle ? 2 : 0
        }
        if(toggle) {
            body.derog_time = minutes;
        }
        return this.client({
            uri: `control/${this.did}`,
            method: 'POST',
            body: body
        })
        .then(() => {
            return self;
        })
    }

    startBoost(minutes){
        return this.toggleBoost(true, minutes);
    }

    stopBoost(){
        return this.toggleBoost(false, null);
    }

    toggleScheduler(toggle){
        let self = this;
        if(self.version !== PRODUCTS.Pilote2.productName){
            return Promise.reject("Boost mode only support for Pilote Gen 2");
        }
        return this.client({
            uri: `control/${this.did}`,
            method: 'POST',
            body: {
                timer_switch: toggle ? 1 : 0
            }
        })
        .then(() => {
            return self;
        })
    }

    startScheduler(){
        return this.toggleScheduler(true);
    }

    stopScheduler(){
        return this.toggleScheduler(false);
    }

    toggleHolidays(toggle, days){
        let self = this;
        if(self.version !== PRODUCTS.Pilote2.productName){
            return Promise.reject("Boost mode only support for Pilote Gen 2");
        }
        let body = {
            derog_mode: toggle ? 1 : 0
        }
        if(toggle) {
            body.derog_time = days;
        }
        return this.client({
            uri: `control/${this.did}`,
            method: 'POST',
            body: body
        })
        .then(() => {
            return self;
        })
    }

    startHolidays(days){
        return this.toggleHolidays(true, days);
    }

    stopHolidays(){
        return this.toggleHolidays(false, null);
    }

    toggleLock(toggle){
        let self = this;
        if(self.version !== PRODUCTS.Pilote2.productName){
            return Promise.reject("Boost mode only support for Pilote Gen 2");
        }
        return this.client({
            uri: `control/${this.did}`,
            method: 'POST',
            body: {
                lock_switch: toggle ? 1 : 0
            }
        })
        .then(() => {
            return self;
        })
    }

    lock(){
        return this.toggleLock(true);
    }

    unlock() {
        return this.toggleLock(false);
    }

    on(){
        return this.updateMode('CONFORT');
    }

    off(){
        return this.updateMode('OFF');
    }

    hgel(){
        return this.updateMode('HGEL');
    }

    confort(){
        return this.updateMode('CONFORT');
    }

    eco(){
        return this.updateMode('ECO');
    }
}


class Heatzy {
    constructor(login, password){
        this.host = HOST;
        this.promises = [];
        this.token = null;
        this.tokenExpires = null;
        this.login = login;
        this.password = password;
        this.getToken();
    }


    client(options){
        const requestOptions = Object.assign(options, {
            baseUrl: `https://${this.host}/app`,
            headers: options.headers || {},
            json: true,
        });

        requestOptions.headers['X-Gizwits-Application-Id'] = HEATZYAPPID;

        return this.getToken().then((token) => {
                if(token) {
                    requestOptions.headers['X-Gizwits-User-token'] = this.token;
                }
                const requestRef = JSON.stringify(requestOptions);
                let promise = this.promises[requestRef];
                if (promise) {
                    return promise;
                }
                promise = new Promise((resolve, reject) => {
                    request(requestOptions, (err, res, body) => {
                        delete this.promises[requestRef];
                        if (err) return reject(err);
                        if (res.statusCode > 299) {
                            return reject(body);
                        }
                        return resolve(body);
                    });
                });

                this.promises[requestRef] = promise;
                return promise;
            });
    }

    getToken() {
        if(this.token) {//TODO : Check token expiration
            return Promise.resolve(this.token);
        }
        const requestLogin = {
            baseUrl: `https://${this.host}/app`,
            headers: {
                'X-Gizwits-Application-Id': HEATZYAPPID
            },
            json: true,
            uri: 'login',
            method: 'POST',
            body: {
                username: this.login,
                password: this.password,
            }
        };
        return new Promise((resolve, reject) => {
            request(requestLogin, (err, res, body) => {
                if (err) return reject(err);
                if (res.statusCode > 299) {
                    return reject(JSON.stringify(body,null,4));
                }
                return resolve(body);
            });
        }).then((body) => {
            this.token = body.token;
            this.tokenExpires = body.expire_at;
            return body.token;
        })
    }

    getDevices() {
        return this.client({
            uri: 'bindings'
        }).then((body) => {
            return body.devices;
        }).then((devices) => {
            return devices
                .filter((device) => {//Filter only supported devices
                    return PRODUCTS[device.product_name] !== undefined;
                })
                .map(device => new HeatzyDevice(device, this.client.bind(this)))
        });
    }
}

module.exports = Heatzy;