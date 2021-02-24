document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    const form = document.querySelector('#compose-form');
    form.addEventListener('submit', submit);

}

// Submit email to server function
// Triger: This function fires whenever submit button is pressed
// Result: It submits users compose mail to the server using POST method
function submit(event) {

    // Query the following values from user inputs form
    const recipientMessage = document.querySelector('#compose-recipients').value;
    const subjectMessage = document.querySelector('#compose-subject').value;
    const bodyMessage = document.querySelector('#compose-body').value;

    // post this inputs to server using fetch request with POST method
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipientMessage,
            subject: subjectMessage,
            body: bodyMessage
        })
    })
    .then(response => response.json())
    .then(data => {
        // Give feedback to user: successful message or error
        if(!data.error){
            alert(data.message);
            stop()
            load_mailbox('sent');
        }
        else{
            alert(data.error);
            stop()
        }
    });
}


function load_mailbox(mailbox) {

    // Show the mailbox and hide compose views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the specific mailbox name i.e inbox, sent or achive
    let mailView = document.querySelector('#emails-view');
    mailView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    //   Compose other messages mailView = element container, mailbox = inbox or sent or achieve
    switchMail(mailView, mailbox)
}

function switchMail(mailView, mailbox) {
    let mailbar; //each message bar

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(result => {

        switch (mailbox) {

            case "inbox":
            case "archive":
                // top bar area
                mailbar = mailItem(id = "top-bar", recipient = "Sender Email", subject = "Subject", timestamp = "Timestamp");
                mailView.appendChild(mailbar);

                // message area
                result.forEach(element => {
                    mailbar = mailItem(id = element.id, recipient = element.sender, subject = element.subject, timestamp = element.timestamp, read = element.read, archived = element.archived);
                    mailView.appendChild(mailbar);
                });

                break;

            case "sent":
                // top bar area
                mailbar = mailItem(id = "top-bar", recipient = "Recipient Email", subject = "Subject", timestamp = "Timestamp");
                mailView.appendChild(mailbar);

                // message area
                result.forEach(element => {
                    mailbar = mailItem(id = element.id, recipient = element.recipients, subject = element.subject, timestamp = element.timestamp, read = element.read);
                    mailView.appendChild(mailbar);
                });

                break;

            default:
                alert(result.error)
        }
    })
}

// Create Email item and append sender/recepient, subject and timestamp
// Triger: This function fires whenever Email item is needed to be created and added to the mail box
// Result: It returns a div element containing several information
function mailItem(id, recipient, subject, timestamp, read, archived) {

    // mail container
    const mailBar = document.createElement('div');
    if (id === "top-bar") {
        mailBar.id = id
    }
    else {
        mailBar.dataset.id = id;
        mailBar.addEventListener('click', gotoId);
    }
    mailBar.classList.add('mailBar');
    // Change mailBar background color depends on read value
    (read) ? mailBar.classList.add('read') : mailBar.classList.add('unread');

    // Recipient
    const recipientBar = document.createElement('div');
    recipientBar.textContent = recipient;
    mailBar.appendChild(recipientBar);

    // Subject
    const subjectBar = document.createElement('div');
    subjectBar.textContent = subject;
    mailBar.appendChild(subjectBar);

    // Timestamp
    const timestampBar = document.createElement('div');
    timestampBar.textContent = timestamp;
    timestampBar.style.textAlign = "left";
    mailBar.appendChild(timestampBar);

    // Archieved
    const archivedButton = document.createElement('button');

    archivedButton.addEventListener('click', toggleArchieve);

    // Change button text depends on archieved value which is true or false
    (archived) ? archivedButton.textContent = "Unarchive" : archivedButton.textContent = "Archive";
    archivedButton.style.textAlign = "center";

    // if achieved is not provided incase of sent, do not add it
    (archived === undefined) ? mailBar.gridTemplateColumns = "30% 45% 20%" : mailBar.appendChild(archivedButton);

    // Return mailbar container
    return mailBar;
}


// Triger: This function fires whenever achieve or unachieve button is pressed
// Methods: It makes changes to server information using put method
// Result: it removes and toggle the events between inbox and achieve
function toggleArchieve(event) {
    event = event.currentTarget;
    // alert(event)
    let parent = event.parentElement;
    parent.removeEventListener('click', gotoId)
    fetch(`emails/${parent.dataset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !(event.textContent === "Unarchive")
        })
    })
    parent.style.animationPlayState = "running";
    setTimeout(() => { parent.remove() }, 3000);
}




// Triger: This function fires whenever a mail bar is clicked to show that it is read
// Methods: It makes changes to server information using put method
// Result: it changes read to true
function readText(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
}


// Triger: This function fires whenever mail bar containing message is pressed
// Methods: It makes specific id requst information to server using get method
// Result: It opens a new page and display required information to user
function gotoId(event) {
    const id = event.target.parentElement.dataset.id;
    // Hide compose View
    document.querySelector('#compose-view').style.display = 'none';

    // Display email view 
    let view = document.querySelector('#emails-view');
    view.style.display = 'block';

    // Clear the contents of email view 
    fetch(`/emails/${parseInt(id)}`)
        .then(response => response.json())
        .then(data => {
            // Give feedback to user: successful message or error
            if (!data.error) {
                readText(id)
                view.innerHTML = "";
                view.appendChild(displayIdItem(id, data.sender, data.recipients, data.subject, data.body, data.timestamp));
            }
            else {
                alert(data.error)
            }
        })
}



// Triger: This is the content of each specific mail
// Methods/Result: creates the require elements needed to display the content to view
function displayIdItem(id, sender, recipients, subject, body, timestamp) {
    // container box
    let container = document.createElement('div');

    const from = document.createElement('p');
    from.innerHTML = `<strong>From: </strong> ${sender}`;
    container.appendChild(from);
    
    const to = document.createElement('p');
    to.innerHTML = `<strong>To: </strong> ${recipients}`;
    container.appendChild(to);

    const time = document.createElement('p');
    time.innerHTML = `<strong>Timestamp: </strong> ${timestamp}`;
    container.appendChild(time);

    const reply = document.createElement('button');
    reply.textContent = 'Reply';
    reply.addEventListener('click', () => {
        reply_email(sender, recipients, subject, body, timestamp)
    })
    container.appendChild(reply);

    const hr = document.createElement('hr');
    container.appendChild(hr);

    const bodyText = document.createElement('p');
    bodyText.innerHTML = body
    container.appendChild(bodyText);

    return container;
}



// Triger: This function fires whenever a reply button is pressed
// Methods/Result: it switches to compose view and add existing value for resubmission
function reply_email(sender, recipients, subject, body, timestamp) {
    document.querySelector('h3').textContent = "Reply Email";

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    (document.querySelector('#from').value === sender)? sender = recipients : sender = sender;
    document.querySelector('#compose-recipients').value = sender;
    document.querySelector('#compose-subject').value = (subject.startsWith("Re: ")) ? subject : 'Re: ' + subject;
    document.querySelector('#compose-body').value = `On ${timestamp} ${sender} wrote: ${body}`;

    const form = document.querySelector('#compose-form');
    form.addEventListener('submit', submit);
}