const axios = require('axios');
const TelegramBot =  require('node-telegram-bot-api');
require('dotenv').config();

var cpf = process.env.CPF;
var dataNascimento =  process.env.DATANASCIMENTO;
var codAptidao =  process.env.CODAPTIDAO;
var tipoExame =  process.env.TIPOEXAME;
var month =  process.env.MONTH;

const retryTimeFail =  process.env.RETRYTIMEFAIL;
const retryTimeSuccess = process.env.RETRYTIMESUCCESS;

const telegramBotToken = process.env.TELEGRAMTOKEN;
const telegramChatId =  process.env.TELEGRAMIDCHAT;

function agendarDetran(){
    axios({
        method: "POST",
        url: "https://online7.detran.pe.gov.br/MvcHabilitacao/Agendamento/PesquisarDataDisponibilidadeTecnica?cpf="+ cpf +
        "&dataNascimento=" + dataNascimento + 
        "&codAptidao=" + codAptidao + 
        "&tipoExame=" + tipoExame,
        responseType: "application/json",
      }).then(function (response) {
    
        const dayDetran = createDate(response.data[0]);
    
        const appointment = new Date();
        appointment.setMonth(appointment.getMonth() + month);
        try{
            if(appointment.getMilliseconds() > dayDetran.getMilliseconds()){
                const bot = new TelegramBot(telegramBotToken, {polling: true});
                    
                bot.sendMessage(telegramChatId, 'Existe um agendamento disponivel para carro no detran no dia ' + dayDetran);

                console.log("Conseguiu encontrar agendamento, novo envio em 10 min");
                setInterval(agendarDetran, retryTimeSuccess);
            }else{
                console.log("Nao conseguiu encontrar agendamento, nova tentativa em 5 min");
                setInterval(agendarDetran, retryTimeFail);
            }
        }catch(error){
            console.log("Erro na aplicacao");
            console.log(error);
        }
    });
}

function createDate(date){
    let d = date.split("/");
    let dat = new Date(d[2] + '/' + d[1] + '/' + d[0]);
    return dat;     
}

agendarDetran();

