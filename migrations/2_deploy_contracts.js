const User = artifacts.require("User");
const Event = artifacts.require("Event");
const Ticket = artifacts.require("Ticket");

module.exports = (deployer, network, accounts) => {
    deployer.deploy(User).then(
      function() {
        return deployer.deploy(Event, User.address);
      }
    ).then(
      function() {
        return deployer.deploy(Ticket, User.address, Event.address);
      }
    );
  };