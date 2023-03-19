const express = require('express');
const bodyParser=require('body-parser');
const Web3=require('web3');
const contract=require('truffle-contract');

const app=express();


// Loading the compiled smart contract
const MedicalRecordsJSON=require('../build/contracts/MedicalRecords.json');


app.use(bodyParser.json());


// Connect to Ganache
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

// Create an instance of the smart contract
const medicalRecords = contract(MedicalRecordsJSON);
medicalRecords.setProvider(web3.currentProvider);


// Get the accounts from Ganache
web3.eth.getAccounts((err, accounts) => {
    if (err) throw err;
  
    // Set the default account (the first account in Ganache)
    medicalRecords.defaults({ from: accounts[0] });
  });
  

  // Add a new medical record
app.post('/records', async (req, res) => {
    const { aadharID, name, age, gender, medicalhistory } = req.body;
    try {
      // Add the medical record to the smart contract
      const result = await medicalRecords.deployed().then(instance => instance.addPatient(aadharID, name, age, gender, medicalhistory).send({gas:1000000}));
      res.status(201).json({ message: 'Medical record added successfully', transaction: result.tx });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add medical record' });
    }
  });
  
  // Delete a medical record by ID
  // app.delete('/records/:id', async (req, res) => {
  //   const id = req.params.id;
  //   try {
  //     // Delete the medical record from the smart contract
  //     const result = await medicalRecords.deployed().then(instance => instance.deletePatient(id));
  //     res.status(200).json({ message: 'Medical record deleted successfully', transaction: result.tx });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ error: 'Failed to delete medical record' });
  //   }
  // });

  //delete a record using aadhar id 
  app.delete('/records/:aadharid',async(req,res) => {
     const aadharid=req.params.aadharid;

     try{
      const id=  await medicalRecords.deployed().then(instance => instance.getPatientIdByAadharID(aadharid));
      await medicalRecords.deployed().then(instance => instance.deletePatient(id).send({gas:1000000}));
     
     res.status(201).json({message:'Medical record deleted successfully'});

     }catch(err){
       
      res.status(500).json({error:'Failed to delete medical record'});
     }
  });

  //get record by aadhar id
  app.get('/records/:aadharid',async(req,res) =>{
    const aadharid=req.params.aadharid;

    try{
     const patientId=  await medicalRecords.deployed().then(instance => instance.getPatientIdByAadharID(aadharid));
     const patient=await medicalRecords.deployed().then(instance => instance.getPatient(id).call());
       
     if(patient[1]==''){
      throw new Error('Patient not found!');
     }

     res.json({
      id: patientId,
      aadharID: patient[0],
      name: patient[1],
      age: patient[2],
      gender: patient[3],
      medicalHistory: patient[4],
      
  });

    }catch(err){
      res.status(500).json({error:'Failed to fetch medical record'});
    }
  });

app.listen(3000,() => {
console.log("Server running on port 3000");
});