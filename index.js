const fs = require('fs');

function handleGroupsData(userObj, group){
    const patternGroup = /(Sala|Turma|Noturno|Diurno)( \d+)?/gmi

    if(!userObj.groups) userObj.groups = [];
    
    if(group){
    
        const getSubGroups = group.match(patternGroup)
    
        userObj.groups.push(...getSubGroups)
    }
}

function filterAdrresses(addresses, type){
    if(!addresses){
        return ''
    }
    
    if(type === 'email'){
        const emailMatch = /\w+\.?\w+@\w+.com/g;
        const email = addresses.match(emailMatch);
        
        if(email){
            return email
        }
    }
    
    if(type === 'phone'){
        const phoneMatch =/(\d{2,})+/g;
        const phone = addresses.match(phoneMatch);

        if(phone){
            const finalPhone = '55' + phone.join('');
            return finalPhone.length === 13 ? [finalPhone] : false;
        }
    }
}

// Split column addresses and match with row informations
// Add object in addresses list
function handleAddressesData(userObj, column, row){
    if(!userObj.addresses) userObj.addresses = [];

    const [type, ...tags] = column.replaceAll('"', '').split(' ');

    const isValidAdresses = filterAdrresses(row, type)

    if(isValidAdresses){
        isValidAdresses.map(address =>{
            userObj.addresses.push({
                type,
                tags,
                address
            })
        })
    }
}

function handleVisiblitysBoolean(boolean){
    const isFalse = !boolean || boolean.match(/(no|0)/)
    const isTrue = boolean.match(/(yes|1)/)
    
    if(isFalse) return false;
    
    if(isTrue) return true;
}

// Concat the duplicate addresses and groups in source user
function concatUserDuplicates(user, duplicate){
    const { addresses, groups } = duplicate;

    groups.map(group => {
        if(!user.groups.includes(group)){
            user.groups.push(group)
        }
    });

    user.addresses.push(...addresses);
}

// Verify user id (eid) duplicates and copy in only user
// Return a list without duplicates
function verifyDuplicateUser(jsons){
    let userDuplicates = [];

    return jsons.reduce((list, user, self) => {

        if(!userDuplicates.includes(user.eid)){
            
            jsons.map((duplicate, index) => {
                if(user.eid === duplicate.eid && index !== self){
                    userDuplicates.push(duplicate.eid);

                    concatUserDuplicates(user, duplicate)
                }
            })

            list.push(user)
        }

        return list
    }, [])
}

// Match columns in rows informations returning users object
function matchRowsInColumns(columns, rowInfo){

    return columns.reduce((userObj, column, index) => {
        const matchedRotule = rowInfo[index];
   
        switch(column){
            case 'fullname':
            case 'eid':
                userObj[column] = matchedRotule;
            break;
            case 'group':
                handleGroupsData(userObj, matchedRotule);
            break;
            case 'invisible':
            case 'see_all':
                userObj[column] = handleVisiblitysBoolean(matchedRotule);
                break;
            default:
                handleAddressesData(userObj, column, matchedRotule);
            break;
        }

        return userObj
    }, {})
}

// Starting
fs.readFile('input.csv', (err, data) =>{
    const dataConverted = data.toString();

    const [header, ...bodyDatas] = dataConverted
        .split('\n')
        .filter(line => line);

    const splitRowDivisor = /(,".*,.*")?,/g

    const users = bodyDatas.map(row => {

        const rowInfos = row
            .split(splitRowDivisor)
            .filter(data => data !== undefined);

        const columns = header.split(',');

        const user = matchRowsInColumns(columns, rowInfos);

        return user
    })

    const verifiedUsers = verifyDuplicateUser(users);
    const userJSON = JSON.stringify(verifiedUsers)

    fs.writeFile('output.json', userJSON, () => {});
    
    console.log('output.json created')
})