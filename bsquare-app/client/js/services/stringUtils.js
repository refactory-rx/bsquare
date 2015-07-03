mainApp.factory('stringUtils', [function() {
   
    return  {
     
        pad: function(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        },

        parseDate: function(dateTimeStr) {
	
        	var dateTimeParts = dateTimeStr.split(' ');
        	var dateParts = dateTimeParts[0].split('/');
        	var timeParts = dateTimeParts[1].split(':');
        	var day = dateParts[0];
        	var month = dateParts[1]-1;
        	var year = dateParts[2];
        	var hour = timeParts[0];
        	var minute = timeParts[1];
        	//var second = timeParts[2];
        	
        	var date = new Date();
        	date.setFullYear(year);
        	date.setMonth(month);
        	date.setDate(day);
        	date.setHours(hour);
        	date.setMinutes(minute);
        	//date.setSeconds(second);
        	
        	return date;
        	
        },

        formatDate: function(date) {
        	
        	var dateStr =
        		this.pad(date.getDate(), 2)+'/'+
        		this.pad(date.getMonth()+1, 2)+'/'+
        		date.getFullYear()+' '+
        		this.pad(date.getHours(), 2)+':'+
        		this.pad(date.getMinutes(), 2);
        		//this.pad(date.getSeconds(), 2);
        	
        	return dateStr;
        	
        }
     
    };
   
 }]);