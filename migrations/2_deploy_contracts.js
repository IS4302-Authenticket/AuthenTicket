const Event = artifacts.require("Event");
const Ticket = artifacts.require("Ticket");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(Event).then(function() {
      return deployer.deploy(Ticket, Event.address);
      return
    });
  };