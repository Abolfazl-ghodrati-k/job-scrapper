const moment = require('moment');
import fs from 'fs';

export const logger = (text: string, showInConsole = true) => {
    const logText = `${moment().format('YYYY-MM-DD HH:mm:ss')}     ` + text + '\r\n';
    const file = `./logs/${moment().format('YYYY-MM-DD')}.log`;
    if (showInConsole)
        console.log(logText)
    // fs.appendFile(file, logText, 'utf8', (error) => {
    //     if (error) {
    //         console.log(error);
    //     }
    // });
}