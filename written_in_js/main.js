$(function(){
    resetGame();
    bindEvents();
    tallyScore();
});//end ready

var currentPlayer = "1";
var diceTotal = 0;
var partitions = []
var sharedPartitionStaging = [-1] //requires an initial value. -1 is selected because it will be ignored

function bindEvents()
{
    $(".reset-game").click(function(){
        $(this).blur();
        resetGame();    
    });

    $("button.roll").click(function(){
        rollDice();
    });

    $("body").keyup(function(e){
        if(e.keyCode == 13) //enter key
        {
            rollDice();
        }
        else if(e.keyCode == 32) //spacebar
        {
            resetGame();
        }
        else if(e.keyCode > 48 && e.keyCode < 58) //keys 1-9
        {
            toggleTile(e.keyCode - 48);
        }
    });

    $(".toggle-tile").click(function(){
        var tileNumber = $(this).data('tile_number');
        toggleTile(tileNumber);
    }); 
}

function rollDice()
{
    tallyScore();
    if (!validateClose())
    {
        displayMessages("Invalid tile closure. Try again.");
        return false;
    }
    $("div.tile").removeClass('new-game');
    $(".player." + currentPlayer + " div.closed-tile").addClass("tile-locked").removeClass('toggle-tile');

    var currentPlayerScore = $(".score." + currentPlayer).text();
    if(currentPlayerScore == "0")
    {
        displayBanners("CONGRATULATIONS! Player " + currentPlayer + ", You Just Shut The Box!", "banner");
        $(".player." + currentPlayer + " button.roll").prop('disabled',true);
        return true;
    }

    $(".dice").text("");
    diceTotal = rollDie("1");
    
    if(currentPlayerScore > 6)
    {
        diceTotal += rollDie("2");
    }
    else
    {
        $(".dice.2").hide();
    }
    
    if(!hasRemainingMoves())
    {
        $(".player." + currentPlayer + " button.roll").prop('disabled',true);
        const displayNoMoreMoves = async () => {
            await sleep(500);
            displayBanners("You are out of moves. Game Over.");
        }
        displayNoMoreMoves();
    }
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function displayMessages(message)
{
    $(".player." + currentPlayer + " div.messages").text(message).fadeIn("slow").fadeOut(1000);
}

function displayBanners(message)
{
    $(".player." + currentPlayer + " div.banner").text(message).fadeIn("slow");
}

function resetPartitions(){
	partitions = [];
}

function hasRemainingMoves()
{
    findUniqueTilePartitions(1, diceTotal, diceTotal);
    var possibleMoves = partitions.length
    for(var p = 0; p < partitions.length; p++)
    {
        for(var s = 0; s < partitions[p].length; s++)
        {            
            if($(".player." + currentPlayer + " div.closed-tile." + (partitions[p][s])).length > 0)
            {
                possibleMoves--;
                break;
            }
        }
    }

    resetPartitions();
    if(possibleMoves < 1)
    {
        return false;
    }
    return true;
}

function rollDie(diceNumber)
{
    var diceValue = Math.floor(Math.random() * 6) + 1;    
    
    const annimateDice = async () => {
        var modValue = Math.floor(Math.random() * 5) + 2;
        for (var i=0;i<10; i++)
        {              
            $(".dice." + diceNumber).css("transform", "rotate(" + 10*(i % modValue) +"deg)");
            $(".dice." + diceNumber).addClass("dice-rolling");
            await sleep(10*i);
            $(".dice." + diceNumber).text(Math.floor(Math.random() * 6) + 1);            
        }
        return diceValue;
    }
    annimateDice().then(function(){
        $(".dice." + diceNumber).text(diceValue);
        $(".dice." + diceNumber).removeClass("dice-rolling");
        $(".dice." + diceNumber).css("transform","");
    });
    return diceValue;   
}

function tallyScore()
{
    var totalScore = 0;
    $.each($("div.player." + currentPlayer + " .tile:not(.closed-tile)"), function(i,t){
        totalScore += parseInt($(t).data('tile_number'));
    });
    displayScore("div.player." + currentPlayer + " .score", totalScore);
}

function displayScore(selector, score)
{
    $(selector).text(score);
}

function validateClose()
{
    var tilesSelectedTotal = 0;
    $.each($("div.player." + currentPlayer + " .tile.closed-tile:not(.tile-locked):not(.new-game)"), function(idx, t){
        var tilePoints = $(t).data("tile_number");
        tilesSelectedTotal += parseInt(tilePoints);
    });
    return diceTotal === tilesSelectedTotal;
}

function resetGame()
{
    currentPlayer = "1";
    diceTotal = 0;
    $("div.tile").removeClass('tile-locked closed-tile').addClass('new-game toggle-tile');
    tallyScore();
    $(".player." + currentPlayer + " div.messages,div.banner").text("");
    $(".dice").show().text("");
    $("button.roll").prop('disabled',false);
}

function toggleTile(tileNumber)
{
    var tileSelector = ".tile.toggle-tile." + tileNumber;
    if( $(tileSelector).hasClass("closed-tile") )
    {
        $(tileSelector).removeClass('closed-tile');
    }
    else
    {
        $(tileSelector).addClass('closed-tile');
    }        
    return false
}

function findUniqueTilePartitions(idx, remainingValue, maxValue)
{
    //This function omits duplicates in a partion and also values in a partition greater than 9            
    if(remainingValue == 0)
    {
        var partition = sharedPartitionStaging.slice(1, idx);
        partitions.push( partition );
    }
    else
    {
        for (var i = maxValue; i >= 1; i--)
        {
            if(i > remainingValue)
            {                        
                continue;
            } 
            else if(sharedPartitionStaging[idx-1] != i && i < 10)
            {
                sharedPartitionStaging.splice(idx, 0, i);
                findUniqueTilePartitions(idx + 1, remainingValue - i, i);
            }
        }
    }
}